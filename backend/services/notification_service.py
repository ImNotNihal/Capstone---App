"""
Firebase Cloud Messaging (FCM) push notifications.
"""

import logging
from typing import Any

from firebase_admin import messaging

logger = logging.getLogger(__name__)


async def send_push_notification(
    token: str,
    title: str,
    body: str,
    data: dict[str, str] | None = None,
    image_url: str | None = None,
) -> bool:
    """
    Send a push notification to a single FCM registration token.

    Returns True on success, False on failure (logs but does not raise).
    Data values must be strings (FCM requirement).
    """
    try:
        notification = messaging.Notification(
            title=title,
            body=body,
            image=image_url,
        )

        android_config = messaging.AndroidConfig(
            priority="high",
            notification=messaging.AndroidNotification(
                sound="default",
                channel_id="smart_lock_alerts",
            ),
        )

        apns_config = messaging.APNSConfig(
            payload=messaging.APNSPayload(
                aps=messaging.Aps(
                    sound="default",
                    badge=1,
                )
            )
        )

        message = messaging.Message(
            token=token,
            notification=notification,
            android=android_config,
            apns=apns_config,
            data=data or {},
        )

        response = messaging.send(message)
        logger.info("FCM sent: %s → %s", response, title)
        return True

    except Exception as exc:
        logger.error("FCM send failed: %s", exc)
        return False


async def send_multicast_notification(
    tokens: list[str],
    title: str,
    body: str,
    data: dict[str, str] | None = None,
) -> dict[str, Any]:
    """Send the same notification to multiple FCM tokens at once."""
    if not tokens:
        return {"success_count": 0, "failure_count": 0}

    message = messaging.MulticastMessage(
        tokens=tokens,
        notification=messaging.Notification(title=title, body=body),
        data=data or {},
        android=messaging.AndroidConfig(priority="high"),
    )

    try:
        response = messaging.send_each_for_multicast(message)
        return {
            "success_count": response.success_count,
            "failure_count": response.failure_count,
        }
    except Exception as exc:
        logger.error("FCM multicast failed: %s", exc)
        return {"success_count": 0, "failure_count": len(tokens)}
