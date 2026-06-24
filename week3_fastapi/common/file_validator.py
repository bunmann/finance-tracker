# ============================================================================
# File: common/file_validator.py
# Description: Helper utilities for validating uploaded files.
# ============================================================================

def is_csv_file(filename: str) -> bool:
    """
    Returns True if the filename has a .csv extension (case-insensitive),
    otherwise False.
    """
    return filename.lower().endswith(".csv")

def validate_and_read_csv(file) -> str:
    """
    Validates that the file has a .csv extension and its content is valid UTF-8 text.
    Returns the decoded text contents.
    Raises ValueError if validation fails.
    """
    if not is_csv_file(file.filename):
        raise ValueError("File must be a CSV.")
    
    try:
        contents = file.file.read()
        return contents.decode("utf-8")
    except UnicodeDecodeError:
        raise ValueError("File content is not valid text. Please upload a plain-text CSV.")
