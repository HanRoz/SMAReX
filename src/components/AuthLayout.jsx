import { Link } from "react-router-dom";
import {
    BookOpen,
    ArrowLeft,
    Sparkles,
    ShieldCheck,
    Users,
    UploadCloud,
    Bookmark,
    CheckCircle2,
    GraduationCap,
} from "lucide-react";

const authContent = {
    signin: {
        eyebrow: "WELCOME BACK",
        title: "Your academic journey,",
        highlight: "connected.",
        description:
            "Discover, share and make better use of academic resources with fellow IIUM students.",
        features: [
            {
                icon: BookOpen,
                title: "Discover Academic Resources",
                description: "Explore notes, tutorials and study materials.",
            },
            {
                icon: Sparkles,
                title: "Study Smarter with AI",
                description: "Get a quicker understanding of academic documents.",
            },
            {
                icon: ShieldCheck,
                title: "Security Checks",
                description: "Share resources with integrated file security scanning.",
            },
        ],
    },

    signup: {
        eyebrow: "JOIN THE COMMUNITY",
        title: "Study smarter.",
        highlight: "Grow together.",
        description:
            "Become part of a collaborative academic community built for IIUM students.",
        features: [
            {
                icon: Users,
                title: "Connect with IIUM Students",
                description: "Learn together across different kulliyyahs.",
            },
            {
                icon: UploadCloud,
                title: "Share Your Knowledge",
                description: "Contribute notes and useful academic resources.",
            },
            {
                icon: Bookmark,
                title: "Build Your Resource Library",
                description: "Save and organise materials for your studies.",
            },
        ],
    },
};

export default function AuthLayout({
    mode = "signin",
    children,
}) {
    const content = authContent[mode] || authContent.signin;

    return (
        <div className="min-h-screen flex flex-col bg-background text-slate-900">

            {/* Navigation */}
            <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 lg:px-8">

                    {/* SMAReX Logo */}
                    <Link to="/" className="flex items-center gap-2.5">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-lg 	shadow-primary/20">
                            <BookOpen size={23} />
                        </div>

                        <div>
                            <span className="text-xl font-bold tracking-tight text-slate-900">
                                SMAReX
                            </span>

                            <p className="hidden sm:block -mt-1 text-[9px] font-semibold tracking-[2px] text-slate-400">
                                SMART ACADEMIC RESOURCE EXCHANGE
                            </p>
                        </div>
                    </Link>

                    {/* Back to Home */}
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-secondary hover:text-primary"
                    >
                        <ArrowLeft size={16} />
                        <span>Back to Home</span>
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <main className="relative flex flex-1 items-center overflow-hidden">

                {/* Background Glows */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 overflow-hidden"
                >
                    <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-primary/10 blur-3xl" />

                    <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-primary/10 blur-3xl" />
                </div>

                {/* <div className="relative mx-auto grid w-full max-w-6xl items-center gap-8 px-5 py-8 sm:px-8 lg:grid-cols-2 lg:gap-10 lg:py-10"> */}
                <div className="relative mx-auto w-full max-w-5xl px-5 py-8 sm:px-8 lg:py-10">

                    <div className="grid w-full items-stretch overflow-hidden rounded-3xl border border-border bg-white shadow-xl shadow-primary/10 lg:grid-cols-2">

                        {/* Branding Panel */}
                        {/* <aside className="relative hidden flex-col justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-[#002454] via-primary to-[#174D91] p-8 text-white shadow-xl 	shadow-primary/20/60 lg:flex xl:p-10"> */}
                        <aside className="relative hidden flex-col justify-center overflow-hidden bg-gradient-to-br from-[#002454] via-primary to-[#174D91] p-8 pr-20 text-white lg:flex xl:p-10 xl:pr-24">

                            {/* Decorative Background */}
                            <div
                                aria-hidden="true"
                                className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl"
                            />

                            <div
                                aria-hidden="true"
                                className="pointer-events-none absolute -bottom-24 -right-20 h-80 w-80 rounded-full bg-white/10 blur-3xl"
                            />

                            <div
                                className={`relative z-10 ${mode === "signup"
                                    ? "flex h-full flex-1 flex-col justify-between"
                                    : ""
                                    }`}
                            >
                                <div>
                                    {/* Main Icon */}
                                    <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/15 backdrop-blur-sm">
                                        <BookOpen size={32} />
                                    </div>

                                    <p className="mb-4 text-xs font-semibold tracking-[3px] text-blue-100">
                                        {content.eyebrow}
                                    </p>

                                    <h2 className="text-3xl font-extrabold leading-tight tracking-tight xl:text-4xl">
                                        {content.title}

                                        <span className="block text-blue-200">
                                            {content.highlight}
                                        </span>
                                    </h2>

                                    <p className="mt-5 max-w-md text-base leading-7 text-blue-100">
                                        {content.description}
                                    </p>
                                </div>

                                {/* Features */}
                                {/* <div className="mt-6 space-y-4"> */}
                                <div
                                    className={`${mode === "signup"
                                        ? "my-6 space-y-5"
                                        : "mt-6 space-y-4"
                                        }`}
                                >
                                    {content.features.map((feature) => {
                                        const Icon = feature.icon;

                                        return (
                                            <div
                                                key={feature.title}
                                                className="flex items-start gap-4"
                                            >
                                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10">
                                                    <Icon size={21} />
                                                </div>

                                                <div>
                                                    <h3 className="font-semibold text-white">
                                                        {feature.title}
                                                    </h3>

                                                    <p className="mt-1 text-sm leading-6 text-blue-100">
                                                        {feature.description}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>


                                {/* Additional Sign Up Highlights */}
                                {mode === "signup" && (
                                    <div className="mb-8 space-y-5">

                                        {/* Section Heading */}
                                        <div className="border-t border-white/20 pt-6">
                                            <p className="text-xs font-semibold tracking-[3px] text-blue-100">
                                                WHY SMAREX?
                                            </p>
                                        </div>

                                        {/* Highlight Cards */}
                                        <div className="grid grid-cols-3 gap-2">
                                            {[
                                                {
                                                    icon: Sparkles,
                                                    title: "AI-Powered",
                                                    description: "Summarization",
                                                },
                                                {
                                                    icon: ShieldCheck,
                                                    title: "File Security",
                                                    description: "VirusTotal scanning",
                                                },
                                                {
                                                    icon: GraduationCap,
                                                    title: "IIUM Only",
                                                    description: "Email verification",
                                                },
                                            ].map((item) => {
                                                const Icon = item.icon;

                                                return (
                                                    <div
                                                        key={item.title}
                                                        className="flex flex-col items-center rounded-xl border border-white/20 bg-white/10 px-2 py-4 text-center transition-colors hover:bg-white/20"
                                                    >
                                                        <Icon className="mb-3 h-6 w-6 text-blue-200" />

                                                        <h3 className="text-xs font-semibold text-white">
                                                            {item.title}
                                                        </h3>

                                                        <p className="mt-1 text-[11px] leading-4 text-blue-100">
                                                            {item.description}
                                                        </p>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Community Message */}
                                        <div className="rounded-xl border border-white/20 bg-white/10 p-4">
                                            <h3 className="text-sm font-semibold text-white">
                                                Learn together. Achieve more.
                                            </h3>

                                            <p className="mt-2 text-xs leading-6 text-blue-100">
                                                One academic platform to share knowledge,
                                                discover resources and support each other's
                                                learning journey.
                                            </p>
                                        </div>

                                    </div>
                                )}


                                {/* Community Label */}
                                {/* <div className="mt-6 flex items-center gap-2 border-t border-white/20 pt-4 text-sm text-blue-100"> */}
                                <div
                                    className={`flex items-center gap-2 border-t border-white/20 pt-4 text-sm text-blue-100 ${mode === "signup" ? "mt-auto" : "mt-6"
                                        }`}
                                >
                                    <CheckCircle2 size={17} />

                                    Built for the IIUM student community
                                </div>
                            </div>
                            {/* Gradient Divider */}
                            <div
                                aria-hidden="true"
                                // className="pointer-events-none absolute inset-y-0 right-0 z-20 w-6 bg-gradient-to-r from-transparent via-white/20 to-white"
                                className="pointer-events-none absolute inset-y-0 right-0 z-20 w-16 bg-[linear-gradient(to_right,transparent_0%,rgba(255,255,255,0.08)_25%,rgba(255,255,255,0.35)_60%,white_100%)]"
                            />
                        </aside>

                        {/* Authentication Form */}
                        <section className="flex w-full items-center justify-center bg-white p-6 sm:p-8 lg:p-10">
                            <div className="w-full">
                                {children}
                            </div>
                        </section>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-200 bg-white/80 px-6 py-5">
                <p className="text-center text-xs leading-5 text-slate-500">
                    © {new Date().getFullYear()} SMAReX · International Islamic University Malaysia
                </p>
            </footer>
        </div>
    );
}
