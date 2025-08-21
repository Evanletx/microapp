import threading

import webview

from app import app


def start_flask():
    """Run the Flask development server."""
    app.run(debug=False, use_reloader=False)


def create_window():
    """Start the GUI window with the running Flask app."""
    webview.create_window("Tax Return FY25-26 Work Log", "http://127.0.0.1:5000")
    webview.start()


if __name__ == "__main__":
    threading.Thread(target=start_flask, daemon=True).start()
    create_window()
