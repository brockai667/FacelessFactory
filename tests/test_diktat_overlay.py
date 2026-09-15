"""Overlay bez displeja / bez tkinteru sa musí ticho vypnúť (žiadna výnimka, žiadne zablokovanie)."""
import unittest

from diktat.diktat_core import overlay


class OverlayTests(unittest.TestCase):
    def test_disabled_overlay_is_noop(self):
        ov = overlay.Overlay(enabled=False)
        ov.start()
        ov.show("x")
        ov.recording()
        ov.hide()
        self.assertFalse(ov.enabled)

    def test_start_without_display_disables_itself(self):
        import os
        env = os.environ.pop("DISPLAY", None)
        try:
            ov = overlay.Overlay(enabled=True)
            ov.start()            # v CI/kontajneri nie je displej → warning a enabled=False
            ov.show("x")
            ov.hide()
        finally:
            if env is not None:
                os.environ["DISPLAY"] = env
        self.assertFalse(ov.enabled)


if __name__ == "__main__":
    unittest.main()
