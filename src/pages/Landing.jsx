import { Link } from 'react-router-dom';
import {
  BookOpen,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Bookmark,
  Download,
  UploadCloud,
  Users,
} from 'lucide-react';

const features = [
  {
    icon: UploadCloud,
    title: 'Share Notes',
    description:
      'Upload your academic notes, summaries, study guides, and tutorials to help other students.',
    color: 'blue',
  },
  {
    icon: Sparkles,
    title: 'AI Summarization',
    description:
      'Generate AI-powered summaries of supported academic documents to get a quicker understanding of their content.',
    color: 'purple',
  },
  {
    icon: ShieldCheck,
    title: 'Security Check',
    description:
      'Uploads are scanned with VirusTotal to help identify potentially harmful files before they are shared.',
    color: 'green',
  },
  {
    icon: Bookmark,
    title: 'Save Resources',
    description:
      'Bookmark useful academic materials and find them easily in your saved collection.',
    color: 'orange',
  },
  {
    icon: Download,
    title: 'Download Resources',
    description:
      'Access and download academic materials shared by students across different kulliyyahs.',
    color: 'cyan',
  },
  {
    icon: Users,
    title: 'IIUM Student Community',
    description:
      'A shared academic space for IIUM students using verified university email accounts.',
    color: 'pink',
  },
];

const featureColors = {
  blue: 'bg-secondary text-primary',
  purple: 'bg-purple-50 text-purple-600',
  green: 'bg-green-50 text-green-600',
  orange: 'bg-orange-50 text-orange-600',
  cyan: 'bg-cyan-50 text-cyan-600',
  pink: 'bg-pink-50 text-pink-600',
};

export default function Landing() {
  return (
    <div className="landing-page min-h-screen overflow-x-clip bg-white text-slate-900">
      <style>{`
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-fade-up {
          animation: fade-up 0.7s ease-out both;
        }

.hero-glow {
  background:
    radial-gradient(
      ellipse at 15% 20%,
      rgba(0, 53, 128, 0.10),
      transparent 45%
    ),
    radial-gradient(
      ellipse at 85% 65%,
      rgba(71, 133, 200, 0.12),
      transparent 40%
    );
}

.gradient-text {
  background: linear-gradient(
    110deg,
    #002454 10%,
    #003580 50%,
    #4785C8 100%
  );
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

        .feature-card {
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }

        .feature-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 18px 35px rgba(15, 23, 42, 0.08);
        }

        @media (prefers-reduced-motion: reduce) {
          .landing-page *,
          .landing-page *::before,
          .landing-page *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/20">
              <BookOpen size={23} />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900">
                SMAReX
              </span>
              <p className="-mt-1 text-[9px] font-semibold tracking-[2px] text-slate-400">
                SMART ACADEMIC RESOURCE EXCHANGE
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to="/signin"
              className="hidden rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 sm:block"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/20 transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              Get Started
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero-glow relative">
        <div className="animate-fade-up mx-auto max-w-7xl px-6 py-24 text-center sm:py-28 lg:px-8 lg:py-32">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-primary/10 bg-secondary px-4 py-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
            <span className="text-xs font-semibold tracking-wide text-primary">
              BUILT FOR THE IIUM STUDENT COMMUNITY
            </span>
          </div>

          <h1 className="mx-auto max-w-4xl text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Smart Academic
            <br />
            <span className="gradient-text">Resource Exchange</span>
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-base leading-8 text-slate-500 sm:text-lg">
            Share your academic notes, summaries, and study guides with fellow
            IIUM students. Build a collaborative learning community while
            keeping shared resources safer and easier to access.
          </p>

          <div className="mt-9 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center gap-3 rounded-xl bg-primary px-7 py-4 font-semibold text-white shadow-lg shadow-primary/20 transition hover:-translate-y-1 hover:shadow-xl"
            >
              Get Started with IIUM Email
              <ArrowRight size={18} />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-7 py-4 font-semibold text-slate-700 transition hover:border-primary/30 hover:bg-secondary"
            >
              Explore Features
              <ArrowRight size={17} />
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="scroll-mt-24 border-t border-slate-100 bg-slate-50/60 py-20 sm:py-24"
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <span className="text-xs font-bold uppercase tracking-[3px] text-primary">
              SMAReX Features
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Everything You Need to{' '}
              <span className="gradient-text">Study Smarter</span>
            </h2>
            <p className="mt-5 leading-7 text-slate-500">
              Share, discover, organise, and make better use of academic
              resources in one place.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <div
                  key={feature.title}
                  className="feature-card rounded-2xl border border-slate-200 bg-white p-7"
                >
                  <div
                    className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl ${featureColors[feature.color]}`}
                  >
                    <Icon size={27} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-500">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA
      <section className="px-6 py-20 lg:px-8">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-gradient-to-br from-[#002454] via-primary to-[#174D91] px-7 py-14 text-center text-white shadow-xl shadow-primary/20 sm:px-16">
          <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-24 -right-10 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

          <div className="relative z-10">
            <h2 className="text-3xl font-extrabold sm:text-4xl">
              Ready to Get Started?
            </h2>
            <p className="mx-auto mt-5 max-w-xl leading-7 text-blue-100">
              Join SMAReX and start sharing academic resources with the IIUM
              student community.
            </p>
            <Link
              to="/signup"
              className="mt-8 inline-flex items-center gap-3 rounded-xl bg-white px-8 py-4 font-bold text-primary shadow-lg transition hover:-translate-y-1"
            >
              Create Your Account
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section> */}

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-5 sm:flex-row">
            <Link to="/" className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white">
                <BookOpen size={20} />
              </div>
              <div>
                <p className="font-bold text-slate-900">SMAReX</p>
                <p className="text-[10px] font-medium tracking-wider text-slate-400">
                  SMART ACADEMIC RESOURCE EXCHANGE
                </p>
              </div>
            </Link>

            <div className="flex gap-6 text-sm text-slate-500">
              <a href="#features" className="transition hover:text-primary">
                Features
              </a>
              <Link to="/signin" className="transition hover:text-primary">
                Sign In
              </Link>
              <Link to="/signup" className="transition hover:text-primary">
                Sign Up
              </Link>
            </div>
          </div>

          <div className="mt-7 border-t border-slate-200 pt-6 text-center">
            <p className="text-xs text-slate-400">
              © {new Date().getFullYear()} SMAReX · International Islamic
              University Malaysia
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
