# WFH Hours Tracker

A simple Python microapp for recording work-from-home (WFH) hours to assist with Australian Taxation Office (ATO) tax claims.

## Overview

This project provides a lightweight Flask web application for logging your WFH sessions. Each session captures start and end times to calculate total hours worked at home, providing a clear record for tax-time reporting.

## Getting Started

1. Ensure [Python](https://www.python.org/) is installed on your system.
2. Clone this repository.
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the microapp with:
   ```bash
   python app.py
   ```
   The application will be available at [http://localhost:5000](http://localhost:5000).

### Desktop GUI

To launch the work log in a standalone desktop window, run:

```bash
python gui.py
```

This uses [pywebview](https://pywebview.flowrl.com/) to embed the existing Flask
application in a minimal desktop window while keeping the same look and feel.

## Disclaimer

This tool is intended to help with personal record keeping. Always consult official ATO guidelines or a tax professional when preparing your tax return.
