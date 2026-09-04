"""Abstract base class for all serialization formats."""
from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, Optional


class FormatError(Exception):
    """Raised when a format cannot encode or decode a payload."""
    pass


class EligibilityError(FormatError):
    """Raised when a payload is not eligible for a format."""
    pass


class BaseFormat(ABC):
    """
    Abstract base for all serialization format implementations.

    Responsibility:
        - Actual serialization syntax and encoding logic
        - Format-specific decoding logic
        - Eligibility checking
        - Format-specific error reporting

    NOT responsible for:
        - Format registration (serializers/registry.py)
        - Coordinating multiple formats (serializers/serialization_manager.py)
        - Token estimation (services/tokenizer.py)
        - Validation (services/validator.py)
    """

    @property
    @abstractmethod
    def format_id(self) -> str:
        """Unique format identifier string."""
        ...

    @property
    def description(self) -> str:
        return ""

    @abstractmethod
    def is_eligible(self, payload: Any) -> tuple[bool, Optional[str]]:
        """
        Check whether this format can represent the payload.

        Returns:
            (eligible: bool, reason_if_not: Optional[str])
        """
        ...

    @abstractmethod
    def encode(self, payload: Any) -> str:
        """
        Serialize payload to this format's text representation.

        Raises:
            FormatError: if encoding fails for any reason.
        """
        ...

    @abstractmethod
    def decode(self, text: str) -> Any:
        """
        Deserialize text back to Python data structures.

        Raises:
            FormatError: if decoding fails for any reason.
        """
        ...

    def __repr__(self) -> str:
        return f"<{self.__class__.__name__} format_id={self.format_id!r}>"
