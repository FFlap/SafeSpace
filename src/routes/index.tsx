import { createFileRoute, Link } from '@tanstack/react-router'
import { SignInButton, SignedIn, SignedOut } from '@clerk/clerk-react'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

function LandingPage() {
  return (
    <div className="bg-background-base text-deep-gray selection:bg-primary/20 min-h-screen">
      <nav className="fixed w-full z-50 border-b border-orange-50 bg-white/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <span className="h-10 w-10 rounded-2xl overflow-hidden shadow-xl shadow-primary/20">
                <img
                  src="/SafeSpaceLogo.png"
                  alt="SafeSpace logo"
                  className="h-full w-full object-contain"
                />
              </span>
              <span className="text-2xl font-bold tracking-tight text-deep-blue font-display">SafeSpace</span>
            </div>
            <div className="hidden md:flex items-center space-x-10 text-sm font-bold text-deep-gray">
              <a className="hover:text-primary transition-colors font-display" href="#how-it-works">How it Works</a>
              <a className="hover:text-primary transition-colors font-display" href="#features">Safety</a>
              <a className="hover:text-primary transition-colors font-display" href="#communities">Communities</a>
              <div className="flex items-center">
                <SignedOut>
                  <SignInButton mode="modal" forceRedirectUrl="/field">
                    <button className="bg-primary hover:bg-primary/90 text-white px-7 py-3 rounded-full transition-all shadow-lg shadow-primary/25 font-display cursor-pointer">
                      Join Community
                    </button>
                  </SignInButton>
                </SignedOut>
                <SignedIn>
                  <Link to="/field" className="bg-primary hover:bg-primary/90 text-white px-7 py-3 rounded-full transition-all shadow-lg shadow-primary/25 font-display cursor-pointer">
                    Enter Space
                  </Link>
                </SignedIn>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <header className="relative min-h-[95vh] flex items-center pt-24 overflow-hidden">
        <div className="absolute inset-0 grid-bg pointer-events-none"></div>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="orb bg-soft-terracotta w-36 h-36 top-[15%] right-[10%] border border-orange-100">
            <span className="orb-label">STEM Students</span>
          </div>
          <div className="orb bg-soft-sage w-32 h-32 top-[42%] right-[15%] border border-lime-100">
            <span className="orb-label">Women in Tech</span>
          </div>
          <div className="orb bg-[#FEF3C7] w-40 h-40 top-[20%] left-[40%] border border-amber-100/50">
            <span className="orb-label">Latinx Community</span>
          </div>
          <div className="orb bg-soft-terracotta w-32 h-32 bottom-[40%] left-[8%] border border-orange-100">
            <span className="orb-label">Asian American</span>
          </div>
          <div className="orb bg-soft-lavender w-36 h-36 bottom-[22%] right-[30%] border border-purple-100">
            <span className="orb-label">Women's Health</span>
          </div>
          <div className="orb bg-soft-sage w-44 h-44 bottom-[6%] left-[12%] border border-lime-100">
            <span className="orb-label">Black Lives Matter</span>
          </div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-soft-terracotta text-accent-terracotta text-xs font-bold uppercase tracking-widest mb-8 font-display">
              ✨ Your safe harbor online
            </div>
            <h1 className="text-6xl md:text-8xl font-extrabold mb-8 tracking-tight leading-[1.05] text-deep-blue">
              Safe, Anonymous, & <br /><span className="text-primary italic font-medium">Supportive</span> Space.
            </h1>
            <p className="text-xl text-slate-500 mb-12 leading-relaxed max-w-2xl font-normal tracking-wide">
              Join moderated communities built for honest expression. Connect with others who share your journey in a truly secure digital environment.
            </p>
            <div className="flex flex-col sm:flex-row gap-6">
              <SignedOut>
                <SignInButton mode="modal" forceRedirectUrl="/field">
                  <button className="bg-primary text-white px-12 py-5 rounded-full text-lg font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-3 group shadow-2xl shadow-primary/30 font-display cursor-pointer">
                    Join a Community <span className="material-symbols-outlined hand-drawn-icon transition-transform group-hover:translate-x-1">arrow_forward</span>
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <Link to="/field" className="bg-primary text-white px-12 py-5 rounded-full text-lg font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-3 group shadow-2xl shadow-primary/30 font-display cursor-pointer">
                  Go to SafeSpace <span className="material-symbols-outlined hand-drawn-icon transition-transform group-hover:translate-x-1">arrow_forward</span>
                </Link>
              </SignedIn>
              <Link to="/field" className="bg-white border-2 border-slate-100 text-deep-blue px-12 py-5 rounded-full text-lg font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-3 shadow-sm font-display cursor-pointer">
                Start Talking
              </Link>
            </div>
            <div className="mt-20 flex items-center gap-4 text-sm font-semibold text-slate-400">
              <div className="flex -space-x-4">
                <img alt="User avatar" className="w-12 h-12 rounded-full border-4 border-white shadow-md" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAXed6HRShQy-ARRrP9QWVSUJgsopUKcRJAnX0NwCffCSC5LFCUU6EFaQARQAww658YZDdabseWfY3cryw2DOuWL9ynK0lDnrjGsj8SD4XsgJKXnYHfLAU7W-ZHe1G1v0mhST_i7joY2gt_zRDpCgv1zSVE0K97DXDhd4Br6cUu0UMev8vqG925xRpXnPMb16iPb3bvWrKf-YLnb74W_GKp0ED91LYmquOQ81jY6eD-3XKRzyX46NQRSGOPP0HGxmHK5lkc2hPMfKA" />
                <img alt="User avatar" className="w-12 h-12 rounded-full border-4 border-white shadow-md" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAhIu7tz-AIOToHDV-GG8uTeleQgyhye1SkuD36fLHy4w5Rg0jTPYmRlhtCsqwe2m2vqOtaCPJllbT46cahv5kn0K28sTyVBN_M-BVFIjfehlTm1NzJBc3zMEbeuZshzP_tyoMJpgqt6e2PWIOQBJVBYI_9061M9jqfWAFJjk4nXoBrAJbqouodjvVXH7vSRf7E9ZBTakjo1bA9vqAaLKkoA5QlrgErd7PNJJlrO-M6s8WxcSdCfTqAiqbyzIyN-SZdD8R7vE2V3TA" />
                <img alt="User avatar" className="w-12 h-12 rounded-full border-4 border-white shadow-md" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB7AtdeNB6NhKCWRONaDqg_Zsc1KjYWYuzJcW_Fjiqx_h6p7TsJjrbKtHMi0bdSGJNB8Li_NTxgnaij3HQmQ8snxQPr5DnopMlld_OM-vTmK8YJ8zngl5wuTX0glhyUxSYu0NQAwKMjYgMHNHjaJkIzdw7et4w5W2TwkfRaordp7DDm6fBlWPtD1XRq2-hSagPey8IiDPI3S8WEaPjux7ESbnwoECctEUjRKRvgeatpYxa1jCQtw1LK_MINJ6paYaPcEqHTQN3Ivvg" />
              </div>
              <span className="tracking-wide">10k+ members are sharing their stories today.</span>
            </div>
          </div>
        </div>
      </header>

      <section className="py-32 bg-white" id="how-it-works">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-24">
            <h2 className="text-5xl font-extrabold text-deep-blue mb-6">How it Works</h2>
            <p className="text-slate-500 text-xl max-w-2xl mx-auto font-normal tracking-wide">We prioritize your privacy and mental well-being with a simple, secure process.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-16">
            <div className="text-center group">
              <div className="w-24 h-24 bg-soft-terracotta text-accent-terracotta rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 group-hover:rotate-3 transition-transform duration-500">
                <span className="material-symbols-outlined hand-drawn-icon text-5xl">face_6</span>
              </div>
              <h3 className="text-2xl font-bold text-deep-blue mb-5">Anonymous Identity</h3>
              <p className="text-slate-500 text-lg leading-relaxed tracking-wide">Engage without revealing personal data. Your privacy is secured by unique, automated aliases.</p>
            </div>
            <div className="text-center group">
              <div className="w-24 h-24 bg-soft-sage text-accent-sage rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 group-hover:-rotate-3 transition-transform duration-500">
                <span className="material-symbols-outlined hand-drawn-icon text-5xl">shield_person</span>
              </div>
              <h3 className="text-2xl font-bold text-deep-blue mb-5">Safe Moderation</h3>
              <p className="text-slate-500 text-lg leading-relaxed tracking-wide">Our hybrid AI and human moderation system keeps every conversation respectful and safe.</p>
            </div>
            <div className="text-center group">
              <div className="w-24 h-24 bg-soft-lavender text-accent-lavender rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 group-hover:rotate-3 transition-transform duration-500">
                <span className="material-symbols-outlined hand-drawn-icon text-5xl">chat_bubble</span>
              </div>
              <h3 className="text-2xl font-bold text-deep-blue mb-5">Topic-Based Rooms</h3>
              <p className="text-slate-500 text-lg leading-relaxed tracking-wide">Access specialized support tailored to your unique identity and current life challenges.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-32 bg-[#FAF9F7] border-y border-orange-50" id="features">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-24">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 text-primary text-sm font-bold mb-8 font-display uppercase tracking-widest">
                <span className="material-symbols-outlined hand-drawn-icon text-base">verified</span>
                Privacy First
              </div>
              <h2 className="text-5xl md:text-6xl font-extrabold text-deep-blue mb-10 leading-tight">Your Safe Space,<br />Built on Trust.</h2>
              <ul className="space-y-10">
                <li className="flex gap-6">
                  <div className="mt-1 flex-shrink-0 w-10 h-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-primary shadow-sm">
                    <span className="material-symbols-outlined hand-drawn-icon text-2xl">key</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-deep-blue text-xl mb-2">End-to-End Encryption</h4>
                    <p className="text-slate-500 text-lg leading-relaxed tracking-wide">Private messages are fully encrypted. Your data remains strictly between you and your peers.</p>
                  </div>
                </li>
                <li className="flex gap-6">
                  <div className="mt-1 flex-shrink-0 w-10 h-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-primary shadow-sm">
                    <span className="material-symbols-outlined hand-drawn-icon text-2xl">no_encryption</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-deep-blue text-xl mb-2">Ethical Data Practices</h4>
                    <p className="text-slate-500 text-lg leading-relaxed tracking-wide">We never sell your data or use invasive tracking. Our platform is community-funded, not ad-driven.</p>
                  </div>
                </li>
                <li className="flex gap-6">
                  <div className="mt-1 flex-shrink-0 w-10 h-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-primary shadow-sm">
                    <span className="material-symbols-outlined hand-drawn-icon text-2xl">volunteer_activism</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-deep-blue text-xl mb-2">Crisis Support Tools</h4>
                    <p className="text-slate-500 text-lg leading-relaxed tracking-wide">Instant access to professional resources and hotlines whenever you need immediate help.</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="flex-1 w-full">
              <div className="relative bg-white rounded-[3rem] p-12 border border-slate-100 shadow-2xl shadow-orange-900/5 overflow-hidden">
                <div className="flex items-center justify-between mb-10 pb-6 border-b border-slate-50">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-soft-terracotta to-primary/20 flex items-center justify-center">
                      <span className="material-symbols-outlined hand-drawn-icon text-primary">diversity_2</span>
                    </div>
                    <div>
                      <p className="font-bold text-deep-blue text-lg font-display">#women-in-tech</p>
                      <p className="text-sm font-semibold text-accent-sage flex items-center gap-1.5 tracking-wide">
                        <span className="w-2 h-2 bg-accent-sage rounded-full"></span> 128 active now
                      </p>
                    </div>
                  </div>
                  <button className="text-slate-300 hover:text-slate-500">
                    <span className="material-symbols-outlined hand-drawn-icon">more_horiz</span>
                  </button>
                </div>
                <div className="space-y-8">
                  <div className="bg-slate-50 p-6 rounded-[2rem] rounded-tl-none border border-slate-100 max-w-[90%]">
                    <p className="text-deep-gray font-medium leading-relaxed tracking-wide">Does anyone else feel like they have to work twice as hard to be heard in meetings?</p>
                  </div>
                  <div className="bg-primary p-6 rounded-[2rem] rounded-tr-none text-white shadow-xl shadow-primary/20 max-w-[90%] ml-auto">
                    <p className="font-medium leading-relaxed tracking-wide">Absolutely. Our group uses a 'buddy system' to amplify each other. Want to join?</p>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-[2rem] rounded-tl-none border border-slate-100 max-w-[90%]">
                    <p className="text-deep-gray font-medium leading-relaxed tracking-wide">That sounds incredible. How do I get involved? ❤️</p>
                  </div>
                </div>
                <div className="mt-12 flex gap-4">
                  <div className="flex-1 h-16 bg-slate-50 border border-slate-100 rounded-2xl px-8 flex items-center text-base font-medium text-slate-400 font-display">
                    Type anonymously...
                  </div>
                  <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20 cursor-pointer">
                    <span className="material-symbols-outlined hand-drawn-icon">send</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-32 bg-white" id="communities">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-baseline mb-20 gap-6">
            <div>
              <h2 className="text-5xl font-extrabold text-deep-blue mb-5 tracking-tight">Explore Communities</h2>
              <p className="text-slate-500 text-xl font-normal tracking-wide">Find the supportive circle where you belong.</p>
            </div>
            <button className="text-primary text-lg font-bold hover:underline flex items-center gap-2 group font-display cursor-pointer">
              View All <span className="material-symbols-outlined hand-drawn-icon text-2xl transition-transform group-hover:translate-x-1">chevron_right</span>
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="group bg-[#FAF9F7] p-10 rounded-[2.5rem] border border-transparent hover:border-orange-100 hover:bg-white hover:shadow-2xl hover:shadow-orange-900/5 transition-all cursor-pointer">
              <div className="w-16 h-16 rounded-[1.5rem] bg-white text-accent-terracotta flex items-center justify-center mb-10 group-hover:bg-accent-terracotta group-hover:text-white transition-all duration-300 shadow-sm">
                <span className="material-symbols-outlined hand-drawn-icon text-3xl">school</span>
              </div>
              <h3 className="text-2xl font-bold text-deep-blue mb-4">STEM Students</h3>
              <p className="text-slate-500 mb-10 leading-relaxed tracking-wide font-normal">Navigating the intersection of academia and industry.</p>
              <div className="flex items-center text-xs font-bold text-slate-400 uppercase tracking-[0.15em] font-display">
                <span className="material-symbols-outlined hand-drawn-icon text-lg mr-2">groups_3</span> 2.4k members
              </div>
            </div>
            <div className="group bg-[#FAF9F7] p-10 rounded-[2.5rem] border border-transparent hover:border-lime-100 hover:bg-white hover:shadow-2xl hover:shadow-lime-900/5 transition-all cursor-pointer">
              <div className="w-16 h-16 rounded-[1.5rem] bg-white text-accent-sage flex items-center justify-center mb-10 group-hover:bg-accent-sage group-hover:text-white transition-all duration-300 shadow-sm">
                <span className="material-symbols-outlined hand-drawn-icon text-3xl">woman</span>
              </div>
              <h3 className="text-2xl font-bold text-deep-blue mb-4">Women in Tech</h3>
              <p className="text-slate-500 mb-10 leading-relaxed tracking-wide font-normal">Empowering diverse voices across the engineering landscape.</p>
              <div className="flex items-center text-xs font-bold text-slate-400 uppercase tracking-[0.15em] font-display">
                <span className="material-symbols-outlined hand-drawn-icon text-lg mr-2">groups_3</span> 5.1k members
              </div>
            </div>
            <div className="group bg-[#FAF9F7] p-10 rounded-[2.5rem] border border-transparent hover:border-amber-100 hover:bg-white hover:shadow-2xl hover:shadow-amber-900/5 transition-all cursor-pointer">
              <div className="w-16 h-16 rounded-[1.5rem] bg-white text-amber-600 flex items-center justify-center mb-10 group-hover:bg-amber-600 group-hover:text-white transition-all duration-300 shadow-sm">
                <span className="material-symbols-outlined hand-drawn-icon text-3xl">family_history</span>
              </div>
              <h3 className="text-2xl font-bold text-deep-blue mb-4">Latinx Community</h3>
              <p className="text-slate-500 mb-10 leading-relaxed tracking-wide font-normal">Sharing heritage and personal experiences in a safe space.</p>
              <div className="flex items-center text-xs font-bold text-slate-400 uppercase tracking-[0.15em] font-display">
                <span className="material-symbols-outlined hand-drawn-icon text-lg mr-2">groups_3</span> 1.8k members
              </div>
            </div>
            <div className="group bg-[#FAF9F7] p-10 rounded-[2.5rem] border border-transparent hover:border-purple-100 hover:bg-white hover:shadow-2xl hover:shadow-purple-900/5 transition-all cursor-pointer">
              <div className="w-16 h-16 rounded-[1.5rem] bg-white text-accent-lavender flex items-center justify-center mb-10 group-hover:bg-accent-lavender group-hover:text-white transition-all duration-300 shadow-sm">
                <span className="material-symbols-outlined hand-drawn-icon text-3xl">workspace_premium</span>
              </div>
              <h3 className="text-2xl font-bold text-deep-blue mb-4">First-Gen Students</h3>
              <p className="text-slate-500 mb-10 leading-relaxed tracking-wide font-normal">Mentorship and community for first-generation university students.</p>
              <div className="flex items-center text-xs font-bold text-slate-400 uppercase tracking-[0.15em] font-display">
                <span className="material-symbols-outlined hand-drawn-icon text-lg mr-2">groups_3</span> 3.2k members
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-[#FAF9F7] border-t border-orange-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-16">
            <div className="flex items-center gap-3">
              <span className="h-10 w-10 rounded-xl overflow-hidden">
                <img
                  src="/SafeSpaceLogo.png"
                  alt="SafeSpace logo"
                  className="h-full w-full object-contain"
                />
              </span>
              <span className="text-2xl font-bold tracking-tight text-deep-blue font-display">SafeSpace</span>
            </div>
            <div className="flex flex-wrap justify-center gap-x-12 gap-y-6 text-sm font-bold text-slate-500 font-display">
              <a className="hover:text-primary transition-colors" href="#">Privacy Policy</a>
              <a className="hover:text-primary transition-colors" href="#">Terms of Service</a>
              <a className="hover:text-primary transition-colors" href="#">Community Guidelines</a>
              <a className="hover:text-primary transition-colors" href="#">Contact Us</a>
            </div>
            <div className="flex gap-5">
              <a className="w-12 h-12 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-primary hover:text-white transition-all shadow-sm" href="#">
                <span className="material-symbols-outlined hand-drawn-icon text-2xl">mail</span>
              </a>
              <a className="w-12 h-12 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-primary hover:text-white transition-all shadow-sm" href="#">
                <span className="material-symbols-outlined hand-drawn-icon text-2xl">share</span>
              </a>
            </div>
          </div>
          <div className="mt-16 text-center text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] font-display">
            © 2024 SafeSpace Platform. Built with empathy for our community.
          </div>
        </div>
      </footer>
    </div>
  )
}
