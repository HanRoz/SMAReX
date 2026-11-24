// import { supabase } from "../supabaseClient";

// const STATUS_LABELS = {
//     pending: "Pending",
//     dismissed: "Dismissed",
//     reviewed: "Resolved",
// };

// function getResourceStatus(reports) {
//     if (reports.some((report) => report.status === "pending")) {
//         return "Pending";
//     }

//     if (reports.some((report) => report.status === "reviewed")) {
//         return "Resolved";
//     }

//     return "Dismissed";
// }

// export async function getAdminReportedResources() {
//     const { data: reports, error: reportsError } = await supabase
//         .from("resource_reports")
//         .select("id, resource_id, user_id, reason, description, status, created_at")
//         .order("created_at", { ascending: false });

//     if (reportsError) throw reportsError;
//     if (!reports?.length) return [];

//     const resourceIds = [...new Set(reports.map((r) => r.resource_id))];

//     const { data: resources, error: resourcesError } = await supabase
//         .from("resources")
//         .select(
//             "id, title, description, uploader_id, kulliyyah, created_at, security_status"
//         )
//         .in("id", resourceIds);

//     if (resourcesError) throw resourcesError;

//     const profileIds = [
//         ...new Set([
//             ...reports.map((r) => r.user_id),
//             ...(resources || []).map((r) => r.uploader_id),
//         ]),
//     ];

//     const { data: profiles, error: profilesError } = await supabase
//         .from("profiles")
//         .select("id, full_name, display_name")
//         .in("id", profileIds);

//     if (profilesError) throw profilesError;

//     const profileMap = new Map(
//         (profiles || []).map((p) => [p.id, p])
//     );

//     const resourceMap = new Map(
//         (resources || []).map((r) => [r.id, r])
//     );

//     const grouped = new Map();

//     for (const report of reports) {
//         const resource = resourceMap.get(report.resource_id);

//         if (!resource) continue;

//         if (!grouped.has(resource.id)) {
//             const uploader = profileMap.get(resource.uploader_id);

//             grouped.set(resource.id, {
//                 id: resource.id,
//                 title: resource.title,
//                 uploader: uploader?.full_name || "Unknown User",
//                 kulliyyah: resource.kulliyyah,
//                 uploadDate: resource.created_at,
//                 latestDate: report.created_at,
//                 status: "Pending",
//                 description: resource.description,
//                 securityStatus: resource.security_status,
//                 reports: [],
//             });
//         }

//         const reporter = profileMap.get(report.user_id);

//         grouped.get(resource.id).reports.push({
//             id: report.id,
//             reporter: reporter?.full_name || "Unknown User",
//             reason: report.reason,
//             description: report.description || "",
//             date: report.created_at,
//             status: STATUS_LABELS[report.status] || "Pending",
//         });
//     }

//     return Array.from(grouped.values()).map((resource) => ({
//         ...resource,
//         status: getResourceStatus(
//             resource.reports.map((report) => ({
//                 status: report.status.toLowerCase() === "resolved"
//                     ? "reviewed"
//                     : report.status.toLowerCase(),
//             }))
//         ),
//     }));
// }

// export async function dismissAdminResourceReports(resourceId) {
//     const { data, error } = await supabase
//         .from("resource_reports")
//         .update({ status: "dismissed" })
//         .eq("resource_id", resourceId)
//         .eq("status", "pending")
//         .select("id");

//     if (error) throw error;

//     return data?.length ?? 0;
// }


// export async function deleteAdminReportedResource(resourceId, reason) {
//     const {
//         data: { session },
//         error: sessionError,
//     } = await supabase.auth.getSession();

//     if (sessionError || !session) {
//         throw new Error("Please sign in as an administrator.");
//     }

//     const { data, error } = await supabase.functions.invoke(
//         "admin-delete-resourced",
//         {
//             body: {
//                 resourceId,
//                 reason,
//             },
//         }
//     );

//     if (error) {
//         let message = error.message;

//         try {
//             if (error.context) {
//                 const response = await error.context.clone().json();
//                 message = response.error || message;
//             }
//         } catch {
//             // Keep the original error message.
//         }

//         throw new Error(message);
//     }

//     if (!data?.success) {
//         throw new Error(
//             data?.error || "Administrator deletion failed."
//         );
//     }

//     return data;
// }

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
    // 1. Retrieve existing reports and completed moderation audits.
    const [reportsResult, auditsResult] = await Promise.all([
        supabase
            .from("resource_reports")
            .select(
                "id, resource_id, user_id, reason, description, status, created_at"
            )
            .order("created_at", { ascending: false }),

        supabase
            .from("admin_moderation_audit")
            .select(
                "id, resource_id, resource_title, uploader_id, admin_id, action, reason, resource_snapshot, reports_snapshot, status, created_at, completed_at"
            )
            .eq("status", "completed")
            .order("completed_at", { ascending: false }),
    ]);

    if (reportsResult.error) throw reportsResult.error;
    if (auditsResult.error) throw auditsResult.error;

    const reports = reportsResult.data || [];
    const audits = auditsResult.data || [];

    // Return empty only when both sources contain no records.
    if (!reports.length && !audits.length) {
        return [];
    }

    // 2. Retrieve existing reported resources.
    const resourceIds = [
        ...new Set(reports.map((report) => report.resource_id)),
    ];

    let resources = [];

    if (resourceIds.length) {
        const { data, error } = await supabase
            .from("resources")
            .select(
                "id, title, description, uploader_id, kulliyyah, created_at, security_status"
            )
            .in("id", resourceIds);

        if (error) throw error;

        resources = data || [];
    }

    // 3. Collect uploader, reporter and administrator IDs.
    const profileIds = [
        ...new Set([
            ...reports.map((report) => report.user_id),

            ...resources.map((resource) => resource.uploader_id),

            ...audits.map((audit) => audit.uploader_id),

            ...audits.map((audit) => audit.admin_id),

            ...audits.flatMap((audit) =>
                (audit.reports_snapshot || []).map(
                    (report) => report.user_id
                )
            ),
        ].filter(Boolean)),
    ];

    // 4. Retrieve profile names.
    let profiles = [];

    if (profileIds.length) {
        const { data, error } = await supabase
            .from("profiles")
            .select("id, full_name, display_name")
            .in("id", profileIds);

        if (error) throw error;

        profiles = data || [];
    }

    const profileMap = new Map(
        profiles.map((profile) => [profile.id, profile])
    );

    const resourceMap = new Map(
        resources.map((resource) => [resource.id, resource])
    );

    const grouped = new Map();

    // 5. Group existing reports by resource.
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

                // Resource still exists.
                isDeleted: false,
                moderation: null,

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

    // 6. Determine the status of existing reported resources.
    const activeResources = Array.from(grouped.values()).map(
        (resource) => ({
            ...resource,

            status: getResourceStatus(
                resource.reports.map((report) => ({
                    status:
                        report.status.toLowerCase() === "resolved"
                            ? "reviewed"
                            : report.status.toLowerCase(),
                }))
            ),
        })
    );

    // 7. Convert completed audit records into resolved resources.
    const deletedResources = audits.map((audit) => {
        const snapshot = audit.resource_snapshot || {};

        const originalReports = audit.reports_snapshot || [];

        const uploader = profileMap.get(
            audit.uploader_id || snapshot.uploader_id
        );

        const administrator = profileMap.get(audit.admin_id);

        // Preserve the original most recent report date.
        const latestReportDate = originalReports.reduce(
            (latest, report) => {
                if (!report.created_at) return latest;

                if (
                    !latest ||
                    new Date(report.created_at) > new Date(latest)
                ) {
                    return report.created_at;
                }

                return latest;
            },
            null
        );

        return {
            id: audit.resource_id,

            title: audit.resource_title,

            uploader: uploader?.full_name || "Unknown User",

            kulliyyah: snapshot.kulliyyah || "Unknown",

            uploadDate: snapshot.created_at || null,

            latestDate: latestReportDate || audit.created_at,

            status: "Resolved",

            description: snapshot.description || "",

            securityStatus: snapshot.security_status || "Unknown",

            // Resource has been permanently deleted.
            isDeleted: true,

            // Additional moderation information.
            moderation: {
                auditId: audit.id,
                action: audit.action,
                reason: audit.reason,
                adminId: audit.admin_id,
                adminName:
                    administrator?.full_name || "Unknown Administrator",
                status: audit.status,
                createdAt: audit.created_at,
                completedAt: audit.completed_at,
            },

            // Restore report information from the audit snapshot.
            reports: originalReports.map((report) => {
                const reporter = profileMap.get(report.user_id);

                return {
                    id: report.id,
                    reporter: reporter?.full_name || "Unknown User",
                    reason: report.reason,
                    description: report.description || "",
                    date: report.created_at,

                    // Preserve the original report status separately.
                    originalStatus:
                        STATUS_LABELS[report.status] || "Unknown",

                    // Pending reports were resolved by resource deletion.
                    status:
                        report.status === "dismissed"
                            ? "Dismissed"
                            : "Resolved",
                };
            }),
        };
    });

    // 8. Combine existing resources and deleted resource history.
    const deletedIds = new Set(
        deletedResources.map((resource) => resource.id)
    );

    return [
        ...activeResources.filter(
            (resource) => !deletedIds.has(resource.id)
        ),
        ...deletedResources,
    ].sort(
        (a, b) =>
            new Date(b.latestDate) - new Date(a.latestDate)
    );
}


// Dismiss all pending reports for an existing resource.
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


// Permanently delete a reported resource using the Edge Function.
export async function deleteAdminReportedResource(resourceId, reason) {
    const {
        data: { session },
        error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
        throw new Error("Please sign in as an administrator.");
    }

    const { data, error } = await supabase.functions.invoke(
        "admin-delete-resourced",
        {
            body: {
                resourceId,
                reason,
            },
        }
    );

    if (error) {
        let message = error.message;

        try {
            if (error.context) {
                const response = await error.context.clone().json();
                message = response.error || message;
            }
        } catch {
            // Keep the original error message.
        }

        throw new Error(message);
    }

    if (!data?.success) {
        throw new Error(
            data?.error || "Administrator deletion failed."
        );
    }

    return data;
}