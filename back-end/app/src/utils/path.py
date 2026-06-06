"""Proccess Path."""
from os import sep
from os.path import dirname, realpath


class PathUtils(object):
    """Define path utils."""

    @staticmethod
    def get_root_pj_path() -> str:
        """Get Root path."""
        return f"{dirname(realpath(__file__)).rsplit(sep, 2)[0]}/"


ROOT_PATH = PathUtils.get_root_pj_path()