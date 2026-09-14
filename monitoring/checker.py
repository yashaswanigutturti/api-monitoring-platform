import time
import requests
from datetime import datetime

from database.db import db
from database.models import MonitorResult, Incident


def check_service(service):
    start_time = time.perf_counter()

    try:
        response = requests.request(
            method=service.method,
            url=service.url,
            timeout=10
        )

        end_time = time.perf_counter()

        response_time = round(
            (end_time - start_time) * 1000,
            2
        )

        status_code = response.status_code

        if 200 <= status_code < 400:
            status = "UP"
        else:
            status = "DOWN"

        service.status = status
        service.status_code = status_code
        service.response_time = response_time
        service.last_checked = datetime.utcnow()

        result = MonitorResult(
            service_id=service.id,
            status=status,
            status_code=status_code,
            response_time=response_time
        )

        db.session.add(result)

        open_incident = Incident.query.filter_by(
            service_id=service.id,
            status="OPEN"
        ).first()

        if status == "DOWN":

            if not open_incident:
                incident = Incident(
                    service_id=service.id,
                    status="OPEN",
                    failure_reason=f"HTTP {status_code}"
                )

                db.session.add(incident)

        else:

            if open_incident:
                open_incident.status = "RESOLVED"
                open_incident.resolved_at = datetime.utcnow()

        db.session.commit()

        return {
            "status": status,
            "status_code": status_code,
            "response_time": response_time
        }

    except requests.exceptions.Timeout:

        return handle_failure(
            service,
            "Request timed out after 10 seconds"
        )

    except requests.exceptions.RequestException as e:

        return handle_failure(
            service,
            str(e)
        )


def handle_failure(service, error_message):

    service.status = "DOWN"
    service.status_code = None
    service.response_time = None
    service.last_checked = datetime.utcnow()

    result = MonitorResult(
        service_id=service.id,
        status="DOWN",
        error_message=error_message
    )

    db.session.add(result)

    open_incident = Incident.query.filter_by(
        service_id=service.id,
        status="OPEN"
    ).first()

    if not open_incident:

        incident = Incident(
            service_id=service.id,
            status="OPEN",
            failure_reason=error_message
        )

        db.session.add(incident)

    db.session.commit()

    return {
        "status": "DOWN",
        "status_code": None,
        "response_time": None,
        "error": error_message
    }