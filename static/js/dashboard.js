
const token = localStorage.getItem("token");
console.log("TOKEN EXISTS:", !!token);
if (!token) {
    window.location.href = "/login";
}

let responseChart = null;
let uptimeChart = null;


// ================================
// LOAD SERVICES
// ================================

async function loadServices() {
    try {
        const response = await fetch("/api/services", {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (response.status === 401) {
            logout();
            return;
        }

        const services = await response.json();

        renderServices(services);
        updateStats(services);

    } catch (error) {
        console.error("Error loading services:", error);
    }
}


// ================================
// RENDER SERVICES
// ================================

function renderServices(services) {

    const container =
        document.getElementById("servicesContainer");

    container.innerHTML = "";

    if (services.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">◉</div>
                <h3>No APIs being monitored</h3>
                <p>Add your first API above to start monitoring.</p>
            </div>
        `;

        return;
    }

    services.forEach(service => {

        const statusClass =
            service.status === "UP"
                ? "up"
                : service.status === "DOWN"
                ? "down"
                : "unknown";

        const statusText =
            service.status === "UP"
                ? "Operational"
                : service.status === "DOWN"
                ? "Down"
                : "Not checked";

        const responseTime =
            service.response_time !== null
                ? `${service.response_time} ms`
                : "--";

        const lastChecked =
            service.last_checked
                ? formatDate(service.last_checked)
                : "Never";

        const card =
            document.createElement("div");

        card.className = "service-card";

        card.innerHTML = `
            <div class="service-info">

                <div class="service-status ${statusClass}">
                    ${
                        service.status === "UP"
                            ? "✓"
                            : service.status === "DOWN"
                            ? "!"
                            : "?"
                    }
                </div>

                <div>
                    <h3>
                        ${escapeHtml(service.name)}
                    </h3>

                    <p class="service-url">
                        ${escapeHtml(service.url)}
                    </p>
                </div>

            </div>

            <div class="service-details">

                <div class="service-metric">
                    <span>Status</span>
                    <strong class="${statusClass}">
                        ${statusText}
                    </strong>
                </div>

                <div class="service-metric">
                    <span>Response</span>
                    <strong>
                        ${responseTime}
                    </strong>
                </div>

                <div class="service-metric">
                    <span>HTTP</span>
                    <strong>
                        ${service.status_code || "--"}
                    </strong>
                </div>

                <div class="service-metric">
                    <span>Checked</span>
                    <strong>
                        ${lastChecked}
                    </strong>
                </div>

            </div>

            <div class="service-actions">

                <button
                    class="check-button"
                    onclick="checkService(${service.id})"
                >
                    Check
                </button>

                <button
                    class="history-button"
                    onclick="showAnalytics(
                        ${service.id},
                        '${escapeHtml(service.name)}'
                    )"
                >
                    Analytics
                </button>

                <button
                    class="delete-button"
                    onclick="deleteService(${service.id})"
                >
                    Delete
                </button>

            </div>
        `;

        container.appendChild(card);
    });
}


// ================================
// DASHBOARD STATS
// ================================

function updateStats(services) {

    const total = services.length;

    const healthy =
        services.filter(
            service => service.status === "UP"
        ).length;

    const down =
        services.filter(
            service => service.status === "DOWN"
        ).length;

    document.getElementById(
        "totalApis"
    ).textContent = total;

    document.getElementById(
        "healthyApis"
    ).textContent = healthy;

    document.getElementById(
        "downApis"
    ).textContent = down;
}


// ================================
// ADD SERVICE
// ================================

async function addService() {

    const name =
        document.getElementById(
            "serviceName"
        ).value.trim();

    let url =
        document.getElementById(
            "serviceUrl"
        ).value.trim();

    const method =
        document.getElementById(
            "serviceMethod"
        ).value;

    if (!name || !url) {
        alert("Please enter API name and URL.");
        return;
    }

    if (
        !url.startsWith("http://") &&
        !url.startsWith("https://")
    ) {
        url = "https://" + url;
    }

    try {

        const response =
            await fetch(
                "/api/services",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Authorization":
                            `Bearer ${token}`
                    },

                    body: JSON.stringify({
                        name: name,
                        url: url,
                        method: method
                    })
                }
            );

        const data =
            await response.json();

        if (!response.ok) {

            alert(
                data.error ||
                "Failed to create API."
            );

            return;
        }

        document.getElementById(
            "serviceName"
        ).value = "";

        document.getElementById(
            "serviceUrl"
        ).value = "";

        await loadServices();
        await loadIncidents();

    } catch (error) {

        alert(
            "Unable to connect to server."
        );

    }
}


// ================================
// MANUAL CHECK
// ================================

async function checkService(serviceId) {

    try {

        const response =
            await fetch(
                `/api/services/${serviceId}/check`,
                {
                    method: "POST",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );

        if (response.status === 401) {
            logout();
            return;
        }

        await loadServices();
        await loadIncidents();

    } catch (error) {

        console.error(
            "Check failed:",
            error
        );

    }
}


// ================================
// DELETE SERVICE
// ================================

async function deleteService(serviceId) {

    const confirmed =
        confirm(
            "Are you sure you want to delete this API?"
        );

    if (!confirmed) {
        return;
    }

    try {

        const response =
            await fetch(
                `/api/services/${serviceId}`,
                {
                    method: "DELETE",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );

        if (response.ok) {

            await loadServices();
            await loadIncidents();

        }

    } catch (error) {

        console.error(
            "Delete failed:",
            error
        );

    }
}


// ================================
// LOAD INCIDENTS
// ================================

async function loadIncidents() {

    try {

        const response =
            await fetch(
                "/api/incidents",
                {
                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );

        if (response.status === 401) {
            logout();
            return;
        }

        const incidents =
            await response.json();

        renderIncidents(incidents);

        const openIncidents =
            incidents.filter(
                incident =>
                    incident.status === "OPEN"
            ).length;

        document.getElementById(
            "incidentCount"
        ).textContent =
            openIncidents;

    } catch (error) {

        console.error(
            "Error loading incidents:",
            error
        );

    }
}


// ================================
// RENDER INCIDENTS
// ================================

function renderIncidents(incidents) {

    const container =
        document.getElementById(
            "incidentsContainer"
        );

    container.innerHTML = "";

    if (incidents.length === 0) {

        container.innerHTML = `
            <div class="empty-state">

                <div class="empty-icon">
                    ✓
                </div>

                <h3>
                    No incidents
                </h3>

                <p>
                    All monitored services are operating normally.
                </p>

            </div>
        `;

        return;
    }

    incidents
        .slice(0, 10)
        .forEach(incident => {

            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "incident-item";

            const isOpen =
                incident.status === "OPEN";

            const statusClass =
                isOpen
                    ? "incident-open"
                    : "incident-resolved";

            const reason =
                incident.failure_reason ||
                "Service failure detected";

            item.innerHTML = `

                <div
                    class="incident-icon ${statusClass}"
                >
                    ${isOpen ? "!" : "✓"}
                </div>

                <div class="incident-info">

                    <div
                        class="incident-title-row"
                    >

                        <h3>
                            ${escapeHtml(
                                incident.service
                            )}
                        </h3>

                        <span
                            class="incident-badge ${statusClass}"
                        >
                            ${incident.status}
                        </span>

                    </div>

                    <p class="incident-reason">
                        ${escapeHtml(reason)}
                    </p>

                    <div class="incident-meta">

                        <span>
                            Started:
                            ${formatDate(
                                incident.started_at
                            )}
                        </span>

                        ${
                            incident.resolved_at
                                ? `
                                    <span>
                                        Resolved:
                                        ${formatDate(
                                            incident.resolved_at
                                        )}
                                    </span>
                                `
                                : ""
                        }

                    </div>

                </div>
            `;

            container.appendChild(item);

        });
}


// ================================
// SHOW ANALYTICS
// ================================

async function showAnalytics(
    serviceId,
    serviceName
) {

    const analytics =
        document.getElementById(
            "analytics"
        );

    analytics.scrollIntoView({
        behavior: "smooth"
    });

    document.getElementById(
        "analyticsTitle"
    ).textContent =
        `${serviceName} Analytics`;

    try {

        const response =
            await fetch(
                `/api/services/${serviceId}/analytics`,
                {
                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );

        if (response.status === 401) {
            logout();
            return;
        }

        const data =
            await response.json();

        console.log(
            "Analytics data:",
            data
        );

        updateAnalyticsCards(data);

        await loadHistory(serviceId);

    } catch (error) {

        console.error(
            "Analytics error:",
            error
        );

    }
}


// ================================
// UPDATE ANALYTICS CARDS
// ================================

function updateAnalyticsCards(data) {

    console.log(
        "Updating analytics cards:",
        data
    );

    const uptime =
        document.getElementById(
            "uptimeValue"
        );

    const average =
        document.getElementById(
            "averageResponse"
        );

    const total =
        document.getElementById(
            "totalChecks"
        );

    const failed =
        document.getElementById(
            "failedChecks"
        );

    if (uptime) {
        uptime.textContent =
            `${data.uptime}%`;
    }

    if (average) {
        average.textContent =
            `${data.average_response_time} ms`;
    }

    if (total) {
        total.textContent =
            data.total_checks;
    }

    if (failed) {
        failed.textContent =
            data.failed_checks;
    }
}


// ================================
// LOAD HISTORY
// ================================

async function loadHistory(serviceId) {

    try {

        const response =
            await fetch(
                `/api/services/${serviceId}/history`,
                {
                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );

        if (response.status === 401) {
            logout();
            return;
        }

        const history =
            await response.json();

        console.log(
            "Monitoring history:",
            history
        );

        renderHistory(history);

        renderCharts(history);

    } catch (error) {

        console.error(
            "History error:",
            error
        );

    }
}


// ================================
// RENDER HISTORY
// ================================

function renderHistory(history) {

    const container =
        document.getElementById(
            "historyContainer"
        );

    container.innerHTML = `

        <div class="history-header">

            <div>

                <h3>
                    Recent Monitoring Checks
                </h3>

                <p>
                    Latest health checks recorded by the monitor.
                </p>

            </div>

        </div>
    `;

    if (history.length === 0) {

        container.innerHTML += `
            <div class="empty-state">
                <p>
                    No monitoring history available yet.
                </p>
            </div>
        `;

        return;
    }

    history.forEach(result => {

        const row =
            document.createElement(
                "div"
            );

        row.className =
            "history-row";

        const statusClass =
            result.status === "UP"
                ? "history-up"
                : "history-down";

        row.innerHTML = `

            <div
                class="history-status ${statusClass}"
            >
                ${result.status}
            </div>

            <div>

                <strong>
                    HTTP
                    ${result.status_code || "--"}
                </strong>

                <small>
                    ${
                        result.error_message ||
                        "Successful response"
                    }
                </small>

            </div>

            <div class="history-response">

                ${
                    result.response_time !== null
                        ? result.response_time + " ms"
                        : "--"
                }

            </div>

            <div class="history-time">

                ${formatDate(
                    result.checked_at
                )}

            </div>
        `;

        container.appendChild(row);

    });
}


// ================================
// RENDER CHARTS
// ================================

function renderCharts(history) {

    console.log(
        "Rendering charts:",
        history.length,
        "records"
    );

    if (typeof Chart === "undefined") {

        console.error(
            "Chart.js is not loaded."
        );

        return;
    }

    const data =
        [...history].reverse();

    if (data.length === 0) {

        console.log(
            "No history available for charts."
        );

        return;
    }

    const labels =
        data.map(
            (_, index) =>
                `Check ${index + 1}`
        );

    const responseTimes =
        data.map(
            result =>
                result.response_time
        );

    const uptimeValues =
        data.map(
            result =>
                result.status === "UP"
                    ? 100
                    : 0
        );


    // ============================
    // RESPONSE TIME CHART
    // ============================

    const responseCanvas =
        document.getElementById(
            "responseChart"
        );

    if (!responseCanvas) {

        console.error(
            "responseChart canvas not found"
        );

        return;
    }

    if (responseChart) {
        responseChart.destroy();
    }

    responseChart =
        new Chart(
            responseCanvas,
            {
                type: "line",

                data: {

                    labels: labels,

                    datasets: [

                        {
                            label:
                                "Response Time (ms)",

                            data:
                                responseTimes,

                            borderWidth: 2,

                            tension: 0.35,

                            fill: true,

                            pointRadius: 3,

                            spanGaps: true
                        }

                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio:
                        false,

                    interaction: {

                        intersect: false,

                        mode: "index"

                    },

                    plugins: {

                        legend: {
                            display: false
                        }

                    },

                    scales: {

                        y: {

                            beginAtZero:
                                true,

                            title: {

                                display:
                                    true,

                                text:
                                    "Milliseconds"

                            }

                        },

                        x: {

                            title: {

                                display:
                                    true,

                                text:
                                    "Monitoring Checks"

                            }

                        }

                    }

                }

            }
        );


    // ============================
    // UPTIME CHART
    // ============================

    const uptimeCanvas =
        document.getElementById(
            "uptimeChart"
        );

    if (!uptimeCanvas) {

        console.error(
            "uptimeChart canvas not found"
        );

        return;
    }

    if (uptimeChart) {
        uptimeChart.destroy();
    }

    uptimeChart =
        new Chart(
            uptimeCanvas,
            {
                type: "line",

                data: {

                    labels: labels,

                    datasets: [

                        {
                            label:
                                "Health",

                            data:
                                uptimeValues,

                            borderWidth: 2,

                            tension: 0.15,

                            fill: true,

                            stepped: true,

                            pointRadius: 3
                        }

                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio:
                        false,

                    interaction: {

                        intersect: false,

                        mode: "index"

                    },

                    plugins: {

                        legend: {
                            display: false
                        }

                    },

                    scales: {

                        y: {

                            min: 0,

                            max: 100,

                            ticks: {

                                callback:
                                    function(value) {

                                        return value + "%";

                                    }

                            }

                        },

                        x: {

                            title: {

                                display:
                                    true,

                                text:
                                    "Monitoring Checks"

                            }

                        }

                    }

                }

            }
        );
}


// ================================
// DATE FORMAT
// ================================

function formatDate(dateString) {

    if (!dateString) {
        return "--";
    }

    const date =
        new Date(dateString);

    return date.toLocaleString(
        "en-IN",
        {
            dateStyle: "short",
            timeStyle: "short"
        }
    );
}


// ================================
// HTML ESCAPE
// ================================

function escapeHtml(value) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        value;

    return div.innerHTML;
}


// ================================
// LOGOUT
// ================================

function logout() {

    localStorage.removeItem(
        "token"
    );

    window.location.href =
        "/login";
}


// ================================
// INITIAL LOAD
// ================================

loadServices();

loadIncidents();


// ================================
// AUTO REFRESH
// ================================

setInterval(
    () => {

        loadServices();

        loadIncidents();

    },
    10000
);

