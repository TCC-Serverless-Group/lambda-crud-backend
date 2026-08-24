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
    ".md",
    ".css",
    ".html",
}

TEXT_FILENAMES = {
    ".env",
    ".gitignore",
}

IGNORED_FILES = {
    "package-lock.json",
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

        # ESTA LINHA PRECISA ESTAR DENTRO DO `for line`
        # mas FORA do `for equivalence`.
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
    Analisa somente arquivos presentes nas duas branches.
    """
    source_files = get_files(
        repo_path,
        source_branch,
    )

    target_files = get_files(
        repo_path,
        target_branch,
    )

    shared_files = sorted(
        file_path
        for file_path in source_files & target_files
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

        source_lines = prepare_lines(source_content)
        target_lines = prepare_lines(target_content)

        comparison = compare_file(
            source_lines,
            target_lines,
        )

        normalized_source_lines = normalize_cloud_lines(
            source_lines,
            file_path,
        )

        normalized_target_lines = normalize_cloud_lines(
            target_lines,
            file_path,
        )

        normalized_comparison = compare_file(
            normalized_source_lines,
            normalized_target_lines,
        )

        comparison["normalized_reuse"] = (
            normalized_comparison["source_reuse"]
        )

        comparison["normalized_similarity"] = (
            normalized_comparison["textual_similarity"]
        )

        comparison["normalized_identical"] = (
            normalized_comparison["identical"]
        )

        comparison["cloud_equivalent"] = (
            normalized_comparison["identical"]
            - comparison["identical"]
        )

        comparison["file"] = file_path

        results.append(comparison)

    return {
        "source_files": source_files,
        "target_files": target_files,
        "shared_files": shared_files,
        "results": results,
    }


def print_file_report(result):
    """
    Exibe o resultado individual de um arquivo.
    """
    print()
    print("=" * 70)
    print(result["file"])
    print("=" * 70)

    print(
        f"Linhas origem:               "
        f"{result['source_lines']}"
    )

    print(
        f"Linhas destino:              "
        f"{result['target_lines']}"
    )

    print(
        f"Linhas idênticas:            "
        f"{result['identical']}"
    )

    print(
        f"Linhas alteradas na origem:  "
        f"{result['source_changed']}"
    )

    print(
        f"Linhas alteradas no destino: "
        f"{result['target_changed']}"
    )

    print(
        f"Reuso da origem:             "
        f"{result['source_reuse'] * 100:.2f}%"
    )

    print(
        f"Correspondência no destino:  "
        f"{result['target_reuse'] * 100:.2f}%"
    )

    print(
        f"Similaridade textual:        "
        f"{result['textual_similarity'] * 100:.2f}%"
    )

    print(
        f"Reuso arquitetural:          "
        f"{result['normalized_reuse'] * 100:.2f}%"
    )

    print(
        f"Similaridade arquitetural:   "
        f"{result['normalized_similarity'] * 100:.2f}%"
    )

    print(
        f"Linhas equivalentes cloud:    "
        f"{result['cloud_equivalent']}"
    )
    


def print_summary(
    analysis,
    source_branch,
    target_branch,
):
    """
    Exibe o resumo geral da comparação.
    """
    source_files = analysis["source_files"]
    target_files = analysis["target_files"]
    shared_files = analysis["shared_files"]
    results = analysis["results"]

    print()
    print("=" * 70)
    print("COMPARAÇÃO ENTRE BRANCHES")
    print("=" * 70)

    print(f"Origem:  {source_branch}")
    print(f"Destino: {target_branch}")
    print()

    print(
        f"Arquivos na origem:       "
        f"{len(source_files)}"
    )

    print(
        f"Arquivos no destino:      "
        f"{len(target_files)}"
    )

    print(
        f"Arquivos compartilhados:  "
        f"{len(source_files & target_files)}"
    )

    print(
        f"Arquivos analisados:      "
        f"{len(shared_files)}"
    )

    if not results:
        return

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

    source_reuse = (
        total_identical / total_source_lines
        if total_source_lines
        else 1.0
    )
    
    target_reuse = (
        total_identical / total_target_lines
        if total_target_lines
        else 1.0
    )

    total_normalized_identical = sum(
        result["normalized_identical"]
        for result in results
    )

    normalized_reuse = (
        total_normalized_identical / total_source_lines
        if total_source_lines
        else 1.0
    )

    print()
    print(f"Linhas origem:            {total_source_lines}")
    print(f"Linhas destino:           {total_target_lines}")
    print(f"Linhas idênticas:         {total_identical}")

    print(
        f"Linhas equivalentes cloud:"
        f" {total_normalized_identical - total_identical}"
    )

    print(
        f"Reuso global da origem:   "
        f"{source_reuse * 100:.2f}%"
    )

    print(
        f"Correspondência destino:  "
        f"{target_reuse * 100:.2f}%"
    )

    print(
        f"Reuso arquitetural global: "
        f"{normalized_reuse * 100:.2f}%"
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


    for result in analysis["results"]:
        if result["file"] == "infra/storage.tf":
            print_file_report(result)
   # for result in analysis["results"]:
   #     print_file_report(result)


if __name__ == "__main__":
    main()