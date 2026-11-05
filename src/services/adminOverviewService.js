import { supabase } from "../supabaseClient";

export async function getAdminOverviewData() {
    const [
        usersResult,
        resourcesResult,
        reportsResult,
        pendingResourcesResult,
        recentResult,
    ] = await Promise.all([
        supabase
            .from("profiles")
            .select("id", { count: "exact", head: true }),

        supabase
            .from("resources")
            .select("id", { count: "exact", head: true }),

        supabase
            .from("resource_reports")
            .select("id", { count: "exact", head: true })
            .eq("status", "pending"),

        // Get resource IDs from individual pending reports.
        supabase
            .from("resource_reports")
            .select("resource_id")
            .eq("status", "pending"),

        supabase
            .from("resources")
            .select("id, title, uploader_id, created_at, security_status")
            .order("created_at", { ascending: false })
            .limit(5),
    ]);

    for (const result of [
        usersResult,
        resourcesResult,
        reportsResult,
        pendingResourcesResult,
        recentResult,
    ]) {
        if (result.error) throw result.error;
    }

    // Count unique resource IDs rather than individual reports.
    const pendingResourceIds = new Set(
        (pendingResourcesResult.data || []).map(
            (report) => report.resource_id
        )
    );

    const recentResources = recentResult.data || [];

    const uploaderIds = [
        ...new Set(
            recentResources
                .map((resource) => resource.uploader_id)
                .filter(Boolean)
        ),
    ];

    let uploaderMap = new Map();

    if (uploaderIds.length > 0) {
        const { data: profiles, error } = await supabase
            .from("profiles")
            .select("id, full_name, display_name")
            .in("id", uploaderIds);

        if (error) throw error;

        uploaderMap = new Map(
            (profiles || []).map((profile) => [
                profile.id,
                profile.full_name ||
                profile.display_name ||
                "Unknown uploader",
            ])
        );
    }

    return {
        totalUsers: usersResult.count ?? 0,
        totalResources: resourcesResult.count ?? 0,
        pendingReports: reportsResult.count ?? 0,
        pendingResources: pendingResourceIds.size,

        recentResources: recentResources.map((resource) => ({
            ...resource,
            uploader:
                uploaderMap.get(resource.uploader_id) ||
                "Unknown uploader",
        })),
    };
}
