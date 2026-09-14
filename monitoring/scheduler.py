import time
import threading

from monitoring.checker import check_service
from database.models import Service


def start_monitoring(app):

    def monitor():

        while True:

            with app.app_context():

                services = Service.query.all()

                for service in services:

                    try:
                        check_service(service)

                    except Exception as e:
                        print(
                            f"Monitoring error for {service.name}: {e}"
                        )

            time.sleep(60)

    thread = threading.Thread(
        target=monitor,
        daemon=True
    )

    thread.start()