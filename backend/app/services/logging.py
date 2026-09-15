from __future__ import annotations

import logging
import re

SENSITIVE_NAME_RE = re.compile(r"(?i)(authorization|cookie|set-cookie|password|token|secret|api[_-]?key|connection[_-]?string)")


class RedactingFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        try:
            if isinstance(record.msg, str) and SENSITIVE_NAME_RE.search(record.msg):
                record.msg = SENSITIVE_NAME_RE.sub('[REDACTED_FIELD]', record.msg)
            if record.args:
                record.args = ()
        except Exception:
            record.msg = '[REDACTED_LOG_RECORD]'
            record.args = ()
        return True


def configure_logging() -> None:
    root = logging.getLogger()
    root.addFilter(RedactingFilter())
    for handler in root.handlers:
        handler.addFilter(RedactingFilter())
