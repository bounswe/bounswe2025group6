"""Project package initialisation.

This file exposes top-level Django apps (e.g. ``reports``) under the
``fithub`` namespace so that dotted imports like ``fithub.reports`` work.

Some of our internal tests attempt to import modules using the
``fithub.<app>`` pattern.  The apps themselves live as top-level packages
next to this ``fithub`` module, so we register them as aliases on import.
"""

from importlib import import_module
import sys


_ALIAS_APPS = ("reports",)


for _app in _ALIAS_APPS:
    _full_name = f"{__name__}.{_app}"
    if _full_name in sys.modules:
        continue
    try:
        module = import_module(_app)
    except ModuleNotFoundError:
        continue
    sys.modules[_full_name] = module

