import json
import os
import threading

import webview

from app import app


class Api:
    """Expose save/load functionality to the webview."""

    def save_data(self, data: str) -> None:
        with open("saved_data.json", "w", encoding="utf-8") as f:
            f.write(data)

    def load_data(self) -> str:
        if os.path.exists("saved_data.json"):
            with open("saved_data.json", "r", encoding="utf-8") as f:
                return f.read()
        return ""

    def exit_app(self, save: bool, data: str | None = None) -> None:
        global should_exit
        if save and data:
            self.save_data(data)
        should_exit = True
        window.destroy()


def start_flask():
    """Run the Flask development server."""
    app.run(debug=False, use_reloader=False)


window = None
should_exit = False


def on_closing():
    if not should_exit:
        window.evaluate_js("showSaveOnExitModal()")
        return False


def create_window():
    """Start the GUI window with the running Flask app."""
    global window
    api = Api()
    window = webview.create_window(
        "Tax Return FY25-26 Work Log", "http://127.0.0.1:5000", js_api=api
    )
    window.events.closing += on_closing
    webview.start()


if __name__ == "__main__":
    threading.Thread(target=start_flask, daemon=True).start()
    create_window()
