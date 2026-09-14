from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from database.db import db
from database.models import Service, MonitorResult
from monitoring.checker import check_service

services = Blueprint("services", __name__)


@services.route("/services", methods=["GET"])
@jwt_required()
def get_services():

    user_id = int(get_jwt_identity())

    services_list = Service.query.filter_by(
        user_id=user_id
    ).all()

    result = []

    for service in services_list:

        result.append({
            "id": service.id,
            "name": service.name,
            "url": service.url,
            "method": service.method,
            "status": service.status,
            "status_code": service.status_code,
            "response_time": service.response_time,
            "last_checked": (
                service.last_checked.isoformat()
                if service.last_checked else None
            )
        })

    return jsonify(result)


@services.route("/services", methods=["POST"])
@jwt_required()
def create_service():

    user_id = int(get_jwt_identity())

    data = request.get_json()

    name = data.get("name")
    url = data.get("url")
    method = data.get("method", "GET")

    if not name or not url:

        return jsonify({
            "error": "Name and URL are required"
        }), 400

    if not url.startswith("http://") and not url.startswith("https://"):

        url = "https://" + url

    service = Service(
        name=name,
        url=url,
        method=method.upper(),
        user_id=user_id
    )

    db.session.add(service)

    db.session.commit()

    return jsonify({
        "message": "Service created",
        "id": service.id
    }), 201


@services.route("/services/<int:service_id>", methods=["DELETE"])
@jwt_required()
def delete_service(service_id):

    user_id = int(get_jwt_identity())

    service = Service.query.filter_by(
        id=service_id,
        user_id=user_id
    ).first()

    if not service:

        return jsonify({
            "error": "Service not found"
        }), 404

    db.session.delete(service)

    db.session.commit()

    return jsonify({
        "message": "Service deleted"
    })


@services.route("/services/<int:service_id>/check", methods=["POST"])
@jwt_required()
def manually_check(service_id):

    user_id = int(get_jwt_identity())

    service = Service.query.filter_by(
        id=service_id,
        user_id=user_id
    ).first()

    if not service:

        return jsonify({
            "error": "Service not found"
        }), 404

    result = check_service(service)

    return jsonify(result)


# ==========================================
# MONITORING HISTORY
# ==========================================

@services.route("/services/<int:service_id>/history", methods=["GET"])
@jwt_required()
def service_history(service_id):

    user_id = int(get_jwt_identity())

    service = Service.query.filter_by(
        id=service_id,
        user_id=user_id
    ).first()

    if not service:

        return jsonify({
            "error": "Service not found"
        }), 404

    results = MonitorResult.query.filter_by(
        service_id=service_id
    ).order_by(
        MonitorResult.checked_at.desc()
    ).limit(50).all()

    history = []

    for result in results:

        history.append({

            "status": result.status,

            "status_code": result.status_code,

            "response_time": result.response_time,

            "error_message": result.error_message,

            "checked_at": result.checked_at.isoformat()

        })

    return jsonify(history)


# ==========================================
# ANALYTICS
# ==========================================

@services.route("/services/<int:service_id>/analytics", methods=["GET"])
@jwt_required()
def service_analytics(service_id):

    user_id = int(get_jwt_identity())

    service = Service.query.filter_by(
        id=service_id,
        user_id=user_id
    ).first()

    if not service:

        return jsonify({
            "error": "Service not found"
        }), 404

    results = MonitorResult.query.filter_by(
        service_id=service_id
    ).all()

    total_checks = len(results)

    successful_checks = 0
    failed_checks = 0

    response_times = []

    for result in results:

        if result.status == "UP":

            successful_checks += 1

        elif result.status == "DOWN":

            failed_checks += 1

        if result.response_time is not None:

            response_times.append(
                result.response_time
            )


    if total_checks > 0:

        uptime = round(
            (successful_checks / total_checks) * 100,
            2
        )

    else:

        uptime = 0


    if response_times:

        average_response_time = round(
            sum(response_times) /
            len(response_times),
            2
        )

        fastest_response = round(
            min(response_times),
            2
        )

        slowest_response = round(
            max(response_times),
            2
        )

    else:

        average_response_time = 0
        fastest_response = 0
        slowest_response = 0


    return jsonify({

        "service": service.name,

        "total_checks": total_checks,

        "successful_checks":
            successful_checks,

        "failed_checks":
            failed_checks,

        "uptime":
            uptime,

        "average_response_time":
            average_response_time,

        "fastest_response":
            fastest_response,

        "slowest_response":
            slowest_response

    })