#!/usr/bin/env python3

import argparse
import subprocess
from dataclasses import dataclass
from pathlib import Path

INCLUDED_PATHS = {
    "frontend/src",
    "backend/src",
    "backend/index.js",
    "frontend/package.json",
    "backend/package.json",
    "task.sql",
    "backend/router.js",
    "backend/index.js",
    "backend/validateToken.js",
    "backend/serverless.yml",
    "cli.js",
}

COUNTED_EXTENSIONS = {
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".yml",
    ".yaml",
    ".sql",
    ".json",
    ".css",
}

@dataclass
class DiffStats:
    added_lines: int = 0
    removed_lines: int = 0
    changed_files: int = 0


@dataclass
class BranchLineStats:
    branch: str
    total_files: int = 0
    total_lines: int = 0


def run_git_command(args: list[str], repo_path: Path) -> str:
    try:
        result = subprocess.run(
            ["git", *args],
            cwd=repo_path,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            check=True
        )
        return result.stdout
    except subprocess.CalledProcessError as error:
        raise RuntimeError(
            f"Erro ao executar comando Git:\n"
            f"git {' '.join(args)}\n\n"
            f"STDERR:\n{error.stderr}"
        ) from error


def validate_git_repo(repo_path: Path) -> None:
    run_git_command(["rev-parse", "--is-inside-work-tree"], repo_path)

def normalize_path(file_path: str) -> str:
    return file_path.replace("\\", "/").strip("/")


def is_inside_or_equal(file_path: str, included_path: str) -> bool:
    file_path = normalize_path(file_path)
    included_path = normalize_path(included_path)

    return file_path == included_path or file_path.startswith(included_path + "/")


def should_count_file(file_path: str) -> bool:
    file_path = normalize_path(file_path)

    filename = Path(file_path).name
    extension = Path(filename).suffix.lower()

    if extension not in COUNTED_EXTENSIONS:
        return False

    return any(
        is_inside_or_equal(file_path, included_path)
        for included_path in INCLUDED_PATHS
    )

def get_diff_stats(branch_a: str, branch_b: str, repo_path: Path) -> DiffStats:
    output = run_git_command(
        ["diff", "--numstat", "-M", "-C", "-w", f"{branch_a}..{branch_b}"],
        repo_path
    )

    stats = DiffStats()

    for line in output.splitlines():
        if not line.strip():
            continue

        parts = line.split("\t")

        if len(parts) < 3:
            continue

        added, removed, file_path = parts[0], parts[1], parts[2]

        if not should_count_file(file_path):
            continue

        stats.changed_files += 1

        if added == "-" or removed == "-":
            continue

        stats.added_lines += int(added)
        stats.removed_lines += int(removed)

    return stats

def percentage(value: int, total: int) -> float:
    if total == 0:
        return 0.0

    return (value / total) * 100

def list_files_in_branch(branch: str, repo_path: Path) -> list[str]:
    output = run_git_command(
        ["ls-tree", "-r", "--name-only", branch],
        repo_path
    )

    return [line.strip() for line in output.splitlines() if line.strip()]


def is_probably_binary(content: bytes) -> bool:
    return b"\x00" in content


def count_lines_from_git_object(
    branch: str,
    file_path: str,
    repo_path: Path
) -> int:
    try:
        result = subprocess.run(
            ["git", "show", f"{branch}:{file_path}"],
            cwd=repo_path,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=True
        )

        content = result.stdout

        if is_probably_binary(content):
            return 0

        text = content.decode("utf-8", errors="replace")
        return len(text.splitlines())

    except subprocess.CalledProcessError:
        return 0

def get_branch_line_stats(branch: str, repo_path: Path) -> BranchLineStats:
    files = list_files_in_branch(branch, repo_path)

    stats = BranchLineStats(
        branch=branch,
        total_files=0
    )

    for file_path in files:
        if not should_count_file(file_path):
            continue

        stats.total_files += 1
        stats.total_lines += count_lines_from_git_object(
            branch,
            file_path,
            repo_path
        )

    return stats


def percentage(value: int, total: int) -> float:
    if total == 0:
        return 0.0

    return (value / total) * 100


def print_report(
    branch_a: str,
    branch_b: str,
    diff_stats: DiffStats,
    branch_a_stats: BranchLineStats,
    branch_b_stats: BranchLineStats
) -> None:
    base_total_lines = branch_a_stats.total_lines

    total_changed_lines = diff_stats.added_lines + diff_stats.removed_lines
    net_line_variation = branch_b_stats.total_lines - branch_a_stats.total_lines

    added_percentage = percentage(diff_stats.added_lines, base_total_lines)
    removed_percentage = percentage(diff_stats.removed_lines, base_total_lines)
    changed_percentage = percentage(total_changed_lines, base_total_lines)
    net_variation_percentage = percentage(net_line_variation, base_total_lines)

    print()
    print("=" * 70)
    print("RELATÓRIO DE COMPARAÇÃO ENTRE BRANCHES")
    print("=" * 70)
    print()
    print(f"Branch principal: {branch_a}")
    print(f"Branch comparada: {branch_b}")
    print()
    print("-" * 70)
    print("DIFERENÇA DE BRANCH PRINCIPAL PARA BRANCH COMPARADA")
    print("-" * 70)
    print(f"Linhas adicionadas : {diff_stats.added_lines} ({added_percentage:.2f}%)")
    print(f"Linhas removidas   : {diff_stats.removed_lines} ({removed_percentage:.2f}%)")
    print(f"Linhas alteradas   : {total_changed_lines} ({changed_percentage:.2f}%)")
    print(f"Arquivos alterados : {diff_stats.changed_files}")
    print()
    print("-" * 70)
    print("TOTAL POR BRANCH")
    print("-" * 70)
    print(f"{branch_a}:")
    print(f"  Total de arquivos : {branch_a_stats.total_files}")
    print(f"  Total de linhas   : {branch_a_stats.total_lines}")
    print()
    print(f"{branch_b}:")
    print(f"  Total de arquivos : {branch_b_stats.total_files}")
    print(f"  Total de linhas   : {branch_b_stats.total_lines}")
    print()
    print("-" * 70)
    print("RESUMO PERCENTUAL")
    print("-" * 70)
    print(f"Base de cálculo:")
    print(f"  Total de linhas da branch {branch_a}: {branch_a_stats.total_lines}")
    print(f"  Total de linhas da branch {branch_b}: {branch_b_stats.total_lines}")
    print()
    print(f"Percentual de linhas adicionadas:")
    print(f"  {added_percentage:.2f}%")
    print()
    print(f"Percentual de linhas removidas:")
    print(f"  {removed_percentage:.2f}%")
    print()
    print(f"Percentual total de linhas modificadas:")
    print(f"  {changed_percentage:.2f}%")
    print()
    print(f"Crescimento/redução líquida da branch:")
    print(f"  {net_line_variation} linhas ({net_variation_percentage:.2f}%)")
    print("=" * 70)
    print()
    print("-" * 70)
    print("ESCOPO ANALISADO")
    print("-" * 70)

    for included_path in sorted(INCLUDED_PATHS):
        print(f"  - {included_path}")

    print()

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Compara duas branches Git e contabiliza linhas adicionadas, removidas, arquivos alterados e total de linhas por branch."
    )

    parser.add_argument(
        "branch_a",
        help="Branch base. Exemplo: main"
    )

    parser.add_argument(
        "branch_b",
        help="Branch comparada. Exemplo: feature/minha-branch"
    )

    parser.add_argument(
        "--repo",
        default=".",
        help="Caminho para o repositório Git. Padrão: diretório atual."
    )

    parser.add_argument(
        "--dirs",
        nargs="*",
        default=[],
        help="Diretórios que devem entrar na análise. Exemplo: --dirs backend frontend src"
    )

    args = parser.parse_args()

    repo_path = Path(args.repo).resolve()

    validate_git_repo(repo_path)

    diff_stats = get_diff_stats(args.branch_a, args.branch_b, repo_path)
    branch_a_stats = get_branch_line_stats(args.branch_a, repo_path)
    branch_b_stats = get_branch_line_stats(args.branch_b, repo_path)

    print_report(
        args.branch_a,
        args.branch_b,
        diff_stats,
        branch_a_stats,
        branch_b_stats
    )


if __name__ == "__main__":
    main()