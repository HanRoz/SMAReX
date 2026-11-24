
import { supabase } from "../supabaseClient";

export async function getRejectedUploads() {
    // Retrieve rejected upload records.
    const { data: uploads, error } = await supabase
        .from("rejected_uploads")
        .select(`
            id,
            uploader_id,
            file_name,
            file_size,
            file_type,
            file_sha256,
            security_status,
            malicious_count,
            suspicious_count,
            total_engines,
            vt_report_url,
            rejection_reason,
            created_at
        `)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false });

    if (error) throw error;

    const rejectedUploads = uploads || [];

    // Extract unique uploader IDs.
    const uploaderIds = [
        ...new Set(
            rejectedUploads
                .map((upload) => upload.uploader_id)
                .filter(Boolean)
        ),
    ];

    let uploaderMap = new Map();

    // Retrieve uploader profile information.
    if (uploaderIds.length > 0) {
        const { data: profiles, error: profileError } =
            await supabase
                .from("profiles")
                .select(`
                    id,
                    full_name,
                    display_name,
                    matric_number,
                    kulliyyah
                `)
                .in("id", uploaderIds);

        if (profileError) throw profileError;

        uploaderMap = new Map(
            (profiles || []).map((profile) => [
                profile.id,
                profile,
            ])
        );
    }

    // Combine rejected upload records with uploader information.
    return rejectedUploads.map((upload) => {
        const profile = uploaderMap.get(upload.uploader_id);

        return {
            ...upload,

            uploader:
                profile?.full_name ||
                profile?.display_name ||
                "Unknown uploader",

            uploaderMatric:
                profile?.matric_number || null,

            uploaderKulliyyah:
                profile?.kulliyyah || null,

            detectionCount:
                upload.malicious_count +
                upload.suspicious_count,
        };
    });
}
