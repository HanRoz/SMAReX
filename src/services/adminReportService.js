import { supabase } from "../supabaseClient";

const STATUS_LABELS = {
    pending: "Pending",
    dismissed: "Dismissed",
    reviewed: "Resolved",
};

function getResourceStatus(reports) {
    if (reports.some((report) => report.status === "pending")) {
        return "Pending";
    }

    if (reports.some((report) => report.status === "reviewed")) {
        return "Resolved";
    }

    return "Dismissed";
}

export async function getAdminReportedResources() {
    const { data: reports, error: reportsError } = await supabase
        .from("resource_reports")
        .select("id, resource_id, user_id, reason, description, status, created_at")
        .order("created_at", { ascending: false });

    if (reportsError) throw reportsError;
    if (!reports?.length) return [];

    const resourceIds = [...new Set(reports.map((r) => r.resource_id))];

    const { data: resources, error: resourcesError } = await supabase
        .from("resources")
        .select(
            "id, title, description, uploader_id, kulliyyah, created_at, security_status"
        )
        .in("id", resourceIds);

    if (resourcesError) throw resourcesError;

    const profileIds = [
        ...new Set([
            ...reports.map((r) => r.user_id),
            ...(resources || []).map((r) => r.uploader_id),
        ]),
    ];

    const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, display_name")
        .in("id", profileIds);

    if (profilesError) throw profilesError;

    const profileMap = new Map(
        (profiles || []).map((p) => [p.id, p])
    );

    const resourceMap = new Map(
        (resources || []).map((r) => [r.id, r])
    );

    const grouped = new Map();

    for (const report of reports) {
        const resource = resourceMap.get(report.resource_id);

        if (!resource) continue;

        if (!grouped.has(resource.id)) {
            const uploader = profileMap.get(resource.uploader_id);

            grouped.set(resource.id, {
                id: resource.id,
                title: resource.title,
                uploader: uploader?.full_name || "Unknown User",
                kulliyyah: resource.kulliyyah,
                uploadDate: resource.created_at,
                latestDate: report.created_at,
                status: "Pending",
                description: resource.description,
                securityStatus: resource.security_status,
                reports: [],
            });
        }

        const reporter = profileMap.get(report.user_id);

        grouped.get(resource.id).reports.push({
            id: report.id,
            reporter: reporter?.full_name || "Unknown User",
            reason: report.reason,
            description: report.description || "",
            date: report.created_at,
            status: STATUS_LABELS[report.status] || "Pending",
        });
    }

    return Array.from(grouped.values()).map((resource) => ({
        ...resource,
        status: getResourceStatus(
            resource.reports.map((report) => ({
                status: report.status.toLowerCase() === "resolved"
                    ? "reviewed"
                    : report.status.toLowerCase(),
            }))
        ),
    }));
}

export async function dismissAdminResourceReports(resourceId) {
    const { data, error } = await supabase
        .from("resource_reports")
        .update({ status: "dismissed" })
        .eq("resource_id", resourceId)
        .eq("status", "pending")
        .select("id");

    if (error) throw error;

    return data?.length ?? 0;
}
