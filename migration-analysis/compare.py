import argparse
import subprocess
from difflib import SequenceMatcher
from pathlib import Path
from equivalences.cli import (
    CLI_NORMALIZATION_EQUIVALENCES,
)

from equivalences.environment import (
    ENVIRONMENT_NORMALIZATION_EQUIVALENCES,
)

from equivalences.openapi import (
    OPENAPI_NORMALIZATION_EQUIVALENCES,
)

from equivalences.serverless import (
    SERVERLESS_NORMALIZATION_EQUIVALENCES
)

from equivalences.terraform import (
    TERRAFORM_NORMALIZATION_EQUIVALENCES,
)

TEXT_EXTENSIONS = {
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".json",
    ".yaml",
    ".yml",
    ".tf",
    ".css",
    ".html",
}

TEXT_FILENAMES = {
    "index.js",
    "package.json",
    "serverless.yml",
    "api_gateway.tf",
    "iam.tf",
    "openapi.yaml",
    "outputs.tf",
    "providers.tf",
    "storage.tf",
    "variables.tf",
    "package.json"
}

IGNORED_PATH_PREFIXES = {
    "migration-analysis/",
}


def should_include_repository_file(file_path):
    return not any(
        file_path.startswith(prefix)
        for prefix in IGNORED_PATH_PREFIXES
    )

IGNORED_FILES = {
    "README.md",
    "backend/README.md",
    "frontend/README.md",
    "package-lock.json",
    ".env",
    ".gitignore"
}

def get_normalization_equivalences(file_path):

    if file_path.endswith(".tf"):
        return TERRAFORM_NORMALIZATION_EQUIVALENCES.get(
            file_path,
            {},
        )

    if file_path == "infra/openapi.yaml":
        return OPENAPI_NORMALIZATION_EQUIVALENCES

    if file_path == "backend/serverless.yml":
        return {
            **SERVERLESS_NORMALIZATION_EQUIVALENCES
        }

    if file_path == "cli.js":
        return {
            **CLI_NORMALIZATION_EQUIVALENCES
        }

    if Path(file_path).name == ".env":
        return ENVIRONMENT_NORMALIZATION_EQUIVALENCES

    return {}
    
def git(repo_path, *args):
    """
    Executa um comando Git no repositório informado
    e retorna stdout como string.
    """
    try:
        result = subprocess.run(
            ["git", *args],
            cwd=repo_path,
            capture_output=True,
            text=True,
            check=True,
        )

        return result.stdout

    except subprocess.CalledProcessError as error:
        message = error.stderr.strip() or error.stdout.strip()

        raise RuntimeError(
            f"Erro ao executar Git: git {' '.join(args)}\n"
            f"{message}"
        ) from error


def get_files(repo_path, branch):
    tree_sha = git(
        repo_path,
        "rev-parse",
        f"{branch}^{{tree}}",
    ).strip()

    return get_files_from_tree(
        repo_path,
        tree_sha,
    )


def get_files_from_tree(repo_path, tree_sha, prefix=""):
    output = git(
        repo_path,
        "cat-file",
        "-p",
        tree_sha,
    )

    files = set()

    for line in output.splitlines():
        if not line.strip():
            continue

        metadata, name = line.split("\t", 1)

        mode, object_type, object_sha = metadata.split()

        file_path = (
            f"{prefix}/{name}"
            if prefix
            else name
        )

        if object_type == "blob":
            files.add(file_path)

        elif object_type == "tree":
            files.update(
                get_files_from_tree(
                    repo_path,
                    object_sha,
                    file_path,
                )
            )

    return files
    
def should_analyze(file_path):
    """
    Define quais arquivos textuais serão considerados
    pela análise.
    """
    path = Path(file_path)

    if path.name in IGNORED_FILES:
        return False

    if path.name in TEXT_FILENAMES:
        return True

    return path.suffix.lower() in TEXT_EXTENSIONS


def get_file_content(repo_path, branch, file_path):
    """
    Obtém o conteúdo de um arquivo diretamente de uma branch,
    sem realizar checkout.
    """
    return git(
        repo_path,
        "show",
        f"{branch}:{file_path}",
    )


def prepare_lines(content):
    """
    Realiza normalização mínima para a V1.

    Apenas remove espaços à direita.
    Não altera indentação ou conteúdo.
    """
    return [
        line.rstrip()
        for line in content.splitlines()
    ]
    
def normalize_cloud_lines(lines, file_path):
    equivalences = get_normalization_equivalences(
        file_path
    )

    normalized_lines = []

    ordered_equivalences = sorted(
        equivalences.items(),
        key=lambda item: max(
            len(item[0]),
            len(item[1]),
        ),
        reverse=True,
    )

    for line in lines:
        normalized_line = line

        for index, (
            aws_value,
            gcp_value,
        ) in enumerate(
            ordered_equivalences,
            start=1,
        ):

            if (
                not isinstance(aws_value, str)
                or not isinstance(gcp_value, str)
            ):
                raise TypeError(
                    "\nEquivalência inválida:"
                    f"\narquivo: {file_path}"
                    f"\naws: {aws_value!r}"
                    f"\ngcp: {gcp_value!r}"
                )

            canonical_name = (
                f"<MIGRATION_EQ:{index}>"
            )

            normalized_line = normalized_line.replace(
                aws_value,
                canonical_name,
            )

            normalized_line = normalized_line.replace(
                gcp_value,
                canonical_name,
            )

        normalized_lines.append(
            normalized_line
        )

    assert len(normalized_lines) == len(lines), (
        f"Normalização alterou quantidade de linhas em {file_path}: "
        f"{len(lines)} -> {len(normalized_lines)}"
    )

    return normalized_lines
    
def compare_file(source_lines, target_lines):
    """
    Compara as linhas de dois arquivos.

    A V1 considera apenas igualdade textual.
    """
    matcher = SequenceMatcher(
        None,
        source_lines,
        target_lines,
        autojunk=False,
    )

    identical = 0
    source_changed = 0
    target_changed = 0

    operations = []

    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        source_count = i2 - i1
        target_count = j2 - j1

        if tag == "equal":
            identical += source_count

        elif tag == "replace":
            source_changed += source_count
            target_changed += target_count

        elif tag == "delete":
            source_changed += source_count

        elif tag == "insert":
            target_changed += target_count

        operations.append(
            {
                "type": tag,
                "source_start": i1 + 1,
                "source_end": i2,
                "target_start": j1 + 1,
                "target_end": j2,
                "source_lines": source_count,
                "target_lines": target_count,
            }
        )

    source_total = len(source_lines)
    target_total = len(target_lines)

    # Quanto da branch de origem foi encontrado literalmente no destino.
    source_reuse = (
        identical / source_total
        if source_total
        else 1.0
    )

    # Quanto do arquivo de destino corresponde literalmente à origem.
    target_reuse = (
        identical / target_total
        if target_total
        else 1.0
    )

    # Similaridade simétrica entre os dois arquivos.
    textual_similarity = matcher.ratio()

    return {
        "source_lines": source_total,
        "target_lines": target_total,
        "identical": identical,
        "source_changed": source_changed,
        "target_changed": target_changed,
        "source_reuse": source_reuse,
        "target_reuse": target_reuse,
        "textual_similarity": textual_similarity,
        "operations": operations,
    }


def analyze_repository(
    repo_path,
    source_branch,
    target_branch,
):
    """
    Analisa arquivos compartilhados entre as branches
    e identifica arquivos exclusivos da origem e destino.
    """

    source_files = {
        file_path
        for file_path in get_files(
            repo_path,
            source_branch,
        )
        if should_include_repository_file(file_path)
    }

    target_files = {
        file_path
        for file_path in get_files(
            repo_path,
            target_branch,
        )
        if should_include_repository_file(file_path)
    }

    # Arquivos existentes nas duas branches.
    shared_repository_files = (
        source_files & target_files
    )

    # Arquivos que existiam na origem,
    # mas não existem no destino.
    source_only_files = sorted(
        source_files - target_files
    )

    # Arquivos criados no destino.
    target_only_files = sorted(
        target_files - source_files
    )

    # Somente arquivos textuais/analisáveis
    # entram na comparação V1/V2.
    shared_files = sorted(
        file_path
        for file_path in shared_repository_files
        if should_analyze(file_path)
    )

    results = []

    for file_path in shared_files:

        source_content = get_file_content(
            repo_path,
            source_branch,
            file_path,
        )

        target_content = get_file_content(
            repo_path,
            target_branch,
            file_path,
        )

        source_lines = prepare_lines(
            source_content
        )

        target_lines = prepare_lines(
            target_content
        )

        # ======================================================
        # COMPARAÇÃO TEXTUAL
        # ======================================================

        comparison = compare_file(
            source_lines,
            target_lines,
        )

        # ======================================================
        # COMPARAÇÃO NORMALIZADA
        # ======================================================

        normalized_source_lines = (
            normalize_cloud_lines(
                source_lines,
                file_path,
            )
        )

        normalized_target_lines = (
            normalize_cloud_lines(
                target_lines,
                file_path,
            )
        )

        normalized_comparison = compare_file(
            normalized_source_lines,
            normalized_target_lines,
        )

        comparison["normalized_reuse"] = (
            normalized_comparison[
                "source_reuse"
            ]
        )

        comparison["normalized_similarity"] = (
            normalized_comparison[
                "textual_similarity"
            ]
        )

        comparison["normalized_identical"] = (
            normalized_comparison[
                "identical"
            ]
        )

        comparison["normalization_gain"] = (
            normalized_comparison[
                "identical"
            ]
            - comparison["identical"]
        )

        comparison["file"] = file_path

        results.append(
            comparison
        )

    # Arquivos 100% preservados
    identical_results = [
        result
        for result in results
            if (
                result["source_lines"]
                == result["target_lines"]
                == result["identical"]
            )
    ]


    # Arquivos que sofreram alguma alteração
    changed_results = [
        result
        for result in results
            if not (
                result["source_lines"]
                == result["target_lines"]
                == result["identical"]
            )
    ]


    return {
        "source_files": source_files,
        "target_files": target_files,
        "shared_files": shared_files,

        "shared_repository_files": shared_repository_files,

        "shared_files": shared_files,

        "source_only_files":source_only_files,

        "target_only_files": target_only_files,

        "results": results,

        "identical_results": identical_results,
        "changed_results": changed_results,
    }

def print_file_report(result):
    print()
    print("=" * 70)
    print(result["file"])
    print("=" * 70)

    print(
        f"Linhas origem:                  "
        f"{result['source_lines']}"
    )

    print(
        f"Linhas destino:                 "
        f"{result['target_lines']}"
    )

    print(
        f"Linhas idênticas:               "
        f"{result['identical']}"
    )

    print(
        f"Linhas alteradas na origem:     "
        f"{result['source_changed']}"
    )

    print(
        f"Linhas alteradas no destino:    "
        f"{result['target_changed']}"
    )

    print()

    print(
        f"Reuso textual da origem:        "
        f"{result['source_reuse'] * 100:.2f}%"
    )

    print(
        f"Correspondência no destino:     "
        f"{result['target_reuse'] * 100:.2f}%"
    )

    print(
        f"Similaridade textual:           "
        f"{result['textual_similarity'] * 100:.2f}%"
    )

    print()

    print(
        f"Reuso normalizado:              "
        f"{result['normalized_reuse'] * 100:.2f}%"
    )

    print(
        f"Similaridade normalizada:       "
        f"{result['normalized_similarity'] * 100:.2f}%"
    )

    print(
        f"Ganho após normalização:        "
        f"{result['normalization_gain']}"
    )

def is_application_file(file_path):
    # Frontend
    if file_path.startswith("frontend/"):
        return not (
            file_path.endswith("README.md")
            or file_path.endswith(".gitignore")
        )

    # Backend
    if file_path.startswith("backend/"):
        excluded_files = {
            "backend/README.md",
            "backend/.gitignore",
            "backend/backup_env",
            "backend/task.sql",
        }

        return file_path not in excluded_files

    return False

def print_summary(
    analysis,
    source_branch,
    target_branch,
):
    source_files = analysis[
        "source_files"
    ]

    target_files = analysis[
        "target_files"
    ]

    shared_repository_files = analysis[
        "shared_repository_files"
    ]

    shared_files = analysis[
        "shared_files"
    ]

    source_only_files = analysis[
        "source_only_files"
    ]

    target_only_files = analysis[
        "target_only_files"
    ]

    results = analysis["results"]

    application_results = [
        result
        for result in results
        if (
            (
                result["file"].startswith("frontend/")
                or result["file"].startswith("backend/")
            )
            and not result["file"].endswith("README.md")
            and not result["file"].endswith(".gitignore")
        )
    ]

    application_source_lines = sum(
        result["source_lines"]
        for result in application_results
    )

    application_target_lines = sum(
        result["target_lines"]
        for result in application_results
    )

    application_identical_lines = sum(
        result["identical"]
        for result in application_results
    )

    application_reuse = (
        application_identical_lines
        / application_source_lines
        if application_source_lines
        else 1.0
    )

    print()
    print("=" * 70)
    print("COMPARAÇÃO ENTRE BRANCHES")
    print("=" * 70)

    print(
        f"Origem:  {source_branch}"
    )

    print(
        f"Destino: {target_branch}"
    )

    # ==========================================================
    # ESTRUTURA DOS REPOSITÓRIOS
    # ==========================================================

    print()
    print("-" * 70)
    print("ESTRUTURA DOS REPOSITÓRIOS")
    print("-" * 70)

    print(
        f"Arquivos na origem:              "
        f"{len(source_files)}"
    )

    print(
        f"Arquivos no destino:             "
        f"{len(target_files)}"
    )

    print(
        f"Arquivos compartilhados:         "
        f"{len(shared_repository_files)}"
    )

    print(
        f"Arquivos analisados pela comparação:  "
        f"{len(shared_files)}"
    )

    print(
        f"Somente na origem:               "
        f"{len(source_only_files)}"
    )

    print(
        f"Criados no destino:              "
        f"{len(target_only_files)}"
    )

    # ==========================================================
    # ARQUIVOS EXCLUSIVOS
    # ==========================================================

    if source_only_files:
        print()
        print(
            "Arquivos presentes somente "
            "na origem:"
        )

        for file_path in source_only_files:
            print(
                f"  - {file_path}"
            )

    if target_only_files:
        print()
        print(
            "Arquivos criados no destino:"
        )

        for file_path in target_only_files:
            print(
                f"  + {file_path}"
            )

    if not results:
        return

    # ==========================================================
    # TOTAIS
    # ==========================================================

    total_source_lines = sum(
        result["source_lines"]
        for result in results
    )

    total_target_lines = sum(
        result["target_lines"]
        for result in results
    )

    total_identical = sum(
        result["identical"]
        for result in results
    )

    total_normalized_identical = sum(
        result["normalized_identical"]
        for result in results
    )

    normalization_gain = (
        total_normalized_identical
        - total_identical
    )

    source_reuse = (
        total_identical
        / total_source_lines
        if total_source_lines
        else 1.0
    )

    target_reuse = (
        total_identical
        / total_target_lines
        if total_target_lines
        else 1.0
    )

    print()
    print("-" * 70)
    print("REUTILIZAÇÃO DA APLICAÇÃO + CONFIGURAÇÃO DE EXECUÇÃO")
    print("-" * 70)

    print(
        f"Linhas origem:                   "
        f"{application_source_lines}"
    )

    print(
        f"Linhas destino:                  "
        f"{application_target_lines}"
    )

    print(
        f"Linhas reutilizadas:             "
        f"{application_identical_lines}"
    )

    print(
        f"Reutilização:                    "
        f"{application_reuse * 100:.2f}%"
    )

    normalized_reuse = (
        total_normalized_identical
        / total_source_lines
        if total_source_lines
        else 1.0
    )

    normalized_target_reuse = (
        total_normalized_identical
        / total_target_lines
        if total_target_lines
        else 1.0
    )

    identical_results = analysis["identical_results"]
    changed_results = analysis["changed_results"]

    print()
    print("-" * 70)
    print("REUSO APÓS NORMALIZAÇÃO DE PROVEDOR")
    print("-" * 70)

    print(
        f"Linhas correspondentes após "
        f"normalização: {total_normalized_identical}"
    )

    print(
        f"Ganho após normalização:         "
        f"{normalization_gain}"
    )

    print(
        f"Reuso normalizado da origem:     "
        f"{normalized_reuse * 100:.2f}%"
    )

    print(
        f"Correspondência normalizada "
        f"destino: {normalized_target_reuse * 100:.2f}%"
    )

    print(
        f"Arquivos integralmente preservados: "
        f"{len(identical_results)}"
    )

    print(
        f"Arquivos com alterações:             "
        f"{len(changed_results)}"
    )

def parse_args():
    parser = argparse.ArgumentParser(
        description=(
            "Compara arquivos compartilhados entre "
            "duas branches Git."
        )
    )

    parser.add_argument(
        "--repo",
        default=".",
        help="Diretório do repositório Git.",
    )

    parser.add_argument(
        "--source",
        default="aws-arch",
        help="Branch de origem.",
    )

    parser.add_argument(
        "--target",
        default="gcp-arch",
        help="Branch de destino.",
    )

    return parser.parse_args()


def main():
    args = parse_args()

    analysis = analyze_repository(
        repo_path=args.repo,
        source_branch=args.source,
        target_branch=args.target,
    )

    print_summary(
        analysis,
        args.source,
        args.target,
    )

    print()
    print("=" * 70)
    print("RESULTADO POR ARQUIVO")
    print("=" * 70)

    for result in analysis["changed_results"]:
        print_file_report(result)


if __name__ == "__main__":
    main()