import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  Code,
  BookOpen,
  ArrowRight,
  Calendar,
  MessageSquare,
  LayoutGrid,
  Sparkles,
  Bell,
  Menu,
  X,
  Check,
  MinusCircle
} from 'lucide-react';
import Logo from '../../components/shared/Logo';
import { useAuth } from '../../context/AuthContext';
import '../../styles/user/homepage.css';

const Landing = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeShowcaseTab, setActiveShowcaseTab] = useState('dashboard');

  const isAdminRole = user && ['ADMIN', 'SUPER_ADMIN', 'admin', 'super_admin'].includes(user.role);
  const isRegularUserLoggedIn = isAuthenticated && user && !isAdminRole;

  const handlePlatformClick = (e, tab, path) => {
    e.preventDefault();
    if (isRegularUserLoggedIn) {
      navigate(path);
    } else {
      setActiveShowcaseTab(tab);
      const element = document.getElementById('showcase');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div style={{ backgroundColor: '#FAFAF9', minHeight: '100vh', fontFamily: 'var(--font-family-sans)' }}>

      {/* Navigation */}
      <nav className="landing-nav">
        <div className="container landing-nav-inner">

          {/* Left: Brand Logo (scrolls to top / hero) */}
          <a href="#home" style={{ textDecoration: 'none' }}>
            <Logo size="medium" showText={true} to={null} />
          </a>

          {/* Center Navigation Links */}
          <ul className="landing-nav-links">
            <li><a href="#features" className="landing-nav-link">Features</a></li>
            <li><a href="#discover" className="landing-nav-link">Discover</a></li>
            <li><a href="#showcase" className="landing-nav-link">Showcase</a></li>
          </ul>

          {/* Right Action Buttons */}
          <div className="nav-buttons">
            {isRegularUserLoggedIn ? (
              <Link to="/dashboard" className="btn-primary-emerald">
                Go to Dashboard <ArrowRight style={{ width: '15px', height: '15px' }} />
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn-secondary-outline">Sign In</Link>
                <Link to="/register" className="btn-primary-emerald">
                  Join ConnectCraft <ArrowRight style={{ width: '15px', height: '15px' }} />
                </Link>
              </>
            )}
          </div>

          {/* Mobile Navigation Toggle */}
          <button
            className="mobile-nav-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X style={{ width: '24px', height: '24px' }} /> : <Menu style={{ width: '24px', height: '24px' }} />}
          </button>

        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className={`container mobile-menu-drawer ${mobileMenuOpen ? 'open' : ''}`}>
            <a href="#features" className="landing-nav-link" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#discover" className="landing-nav-link" onClick={() => setMobileMenuOpen(false)}>Discover</a>
            <a href="#showcase" className="landing-nav-link" onClick={() => setMobileMenuOpen(false)}>Showcase</a>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #E7E5E4' }}>
              {isRegularUserLoggedIn ? (
                <Link
                  to="/dashboard"
                  className="btn-primary-emerald"
                  style={{ justifyContent: 'center' }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Go to Dashboard <ArrowRight style={{ width: '15px', height: '15px' }} />
                </Link>
              ) : (
                <>
                  <Link to="/login" className="btn-secondary-outline" style={{ justifyContent: 'center' }} onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
                  <Link to="/register" className="btn-primary-emerald" style={{ justifyContent: 'center' }} onClick={() => setMobileMenuOpen(false)}>Join ConnectCraft</Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* 2. HERO SECTION */}
      <section className="hero-wrapper" id="home">
        <div className="container">
          <div className="hero-grid">

            {/* Left Side: Headline & CTAs */}
            <div>
              <div className="hero-badge">
                <Sparkles style={{ width: '14px', height: '14px' }} />
                Community-Driven Peer Collaboration Platform
              </div>

              <h1 className="hero-title">
                Connect. Learn.<br />
                <span className="text-teal-gradient">Collaborate. Grow.</span>
              </h1>

              <p className="hero-description">
                ConnectCraft is a real-time platform where developers, creators, and students connect through skills, form project teams, host live workshops, and share knowledge.
              </p>

              <div className="hero-ctas">
                {isRegularUserLoggedIn ? (
                  <Link to="/dashboard" className="btn-primary-emerald" style={{ padding: '0.75rem 1.6rem', fontSize: '0.95rem' }}>
                    Go to Dashboard <ArrowRight style={{ width: '18px', height: '18px' }} />
                  </Link>
                ) : (
                  <Link to="/register" className="btn-primary-emerald" style={{ padding: '0.75rem 1.6rem', fontSize: '0.95rem' }}>
                    Join ConnectCraft <ArrowRight style={{ width: '18px', height: '18px' }} />
                  </Link>
                )}
                <a href="#features" className="btn-secondary-outline" style={{ padding: '0.75rem 1.6rem', fontSize: '0.95rem' }}>
                  Explore Features
                </a>
              </div>
            </div>

            {/* Right Side: Realistic Browser Mockup with Real ConnectCraft UI */}
            <div className="hero-mockup-container">
              <div className="browser-window">

                {/* Browser Header Bar */}
                <div className="browser-bar">
                  <div className="browser-dots">
                    <span className="dot red"></span>
                    <span className="dot yellow"></span>
                    <span className="dot green"></span>
                  </div>
                  <div className="browser-url">https://connect-craft-platform.vercel.app/dashbord</div>
                </div>

                {/* Browser Inner Workspace Stage */}
                <div className="browser-body">

                  {/* Mockup Sidebar */}
                  <div className="mock-sidebar">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', paddingLeft: '0.25rem' }}>
                      <span style={{ fontWeight: 800, color: '#FFF', fontSize: '0.875rem' }}>ConnectCraft</span>
                    </div>

                    <div className="mock-nav-item active">
                      <LayoutGrid style={{ width: '15px', height: '15px' }} /> Dashboard
                    </div>
                    <div className="mock-nav-item">
                      <Users style={{ width: '15px', height: '15px' }} /> Communities
                    </div>
                    <div className="mock-nav-item">
                      <Code style={{ width: '15px', height: '15px' }} /> Projects
                    </div>
                    <div className="mock-nav-item">
                      <Calendar style={{ width: '15px', height: '15px' }} /> Workshops
                    </div>
                    <div className="mock-nav-item">
                      <BookOpen style={{ width: '15px', height: '15px' }} /> Resources
                    </div>
                    <div className="mock-nav-item">
                      <MessageSquare style={{ width: '15px', height: '15px' }} /> Messages
                    </div>
                  </div>

                  {/* Mockup Main Stage */}
                  <div className="mock-main-content">

                    {/* Header bar inside app */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid #E7E5E4' }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1C1917' }}>Collaborative Workspace</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Bell style={{ width: '16px', height: '16px', color: '#78716C' }} />
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0F766E', backgroundColor: '#CCFBF1', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>Active Workspace</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      <div style={{ backgroundColor: '#FFFFFF', padding: '1rem', borderRadius: '12px', border: '1px solid #E7E5E4' }}>
                        <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1C1917' }}>Team Collaboration Space</div>
                        <div style={{ fontSize: '0.8rem', color: '#57534E', marginTop: '0.15rem' }}>Connect with peers based on complementary tech stacks and form project squads.</div>
                      </div>

                      <div style={{ backgroundColor: '#FFFFFF', padding: '1rem', borderRadius: '12px', border: '1px solid #E7E5E4' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1C1917' }}>Research Collaboration Portal</span>
                          <span style={{ fontSize: '0.725rem', fontWeight: 700, color: '#0F766E', backgroundColor: '#CCFBF1', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>Active</span>
                        </div>
                        <div style={{ fontSize: '0.775rem', color: '#57534E', marginBottom: '0.65rem', lineHeight: 1.45 }}>Collaborate on research papers, analyze datasets, and manage academic projects with researchers and students.</div>
                      </div>
                    </div>

                  </div>

                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section-wrapper bg-section-gray" id="features">
        <div className="container">

          <div className="section-title-box">
            <span className="section-label">Core Capabilities</span>
            <h2 className="section-main-heading">Everything You Need to Connect & Build</h2>
            <p className="section-subtext">
              Clean, purpose-built features designed specifically for peer collaboration, skill sharing, and portfolio creation.
            </p>
          </div>

          <div className="features-grid-3">

            {/* Feature 1: Communities */}
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <Users style={{ width: '24px', height: '24px' }} />
              </div>
              <h3 className="feature-card-title">Communities</h3>
              <p className="feature-card-desc">
                Join dedicated ecosystems tailored to Music Production, Fitness & Wellness, Software Engineering, Creative Design, and diverse interests.
              </p>
            </div>

            {/* Feature 2: Projects */}
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <Code style={{ width: '24px', height: '24px' }} />
              </div>
              <h3 className="feature-card-title">Projects</h3>
              <p className="feature-card-desc">
                Form project squads, recruit team members with complementary skills, track task milestones, and build real-world initiatives together.
              </p>
            </div>

            {/* Feature 3: Workshops */}
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <Calendar style={{ width: '24px', height: '24px' }} />
              </div>
              <h3 className="feature-card-title">Workshops</h3>
              <p className="feature-card-desc">
                Host and participate in live peer webinars, interactive skill workshops, and hands-on masterclasses.
              </p>
            </div>

            {/* Feature 4: Resources */}
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <BookOpen style={{ width: '24px', height: '24px' }} />
              </div>
              <h3 className="feature-card-title">Resources</h3>
              <p className="feature-card-desc">
                Publish guides, learning links, video tutorials, and reference materials. Bookmark resources for quick access anytime.
              </p>
            </div>

            {/* Feature 5: Real-time Messaging */}
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <MessageSquare style={{ width: '24px', height: '24px' }} />
              </div>
              <h3 className="feature-card-title">Real-time Messaging</h3>
              <p className="feature-card-desc">
                Private 1-on-1 messaging to keep project collaborators synced and connected.
              </p>
            </div>

            {/* Feature 6: Notifications */}
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <Bell style={{ width: '24px', height: '24px' }} />
              </div>
              <h3 className="feature-card-title">Notifications</h3>
              <p className="feature-card-desc">
                Instant notification updates for project invitations, peer connection requests, and upcoming workshop reminders.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* 4. DISCOVER SECTION */}
      <section className="section-wrapper" id="discover" style={{ backgroundColor: '#FAFAF9' }}>
        <div className="container">

          <div className="section-title-box">
            <span className="section-label">Discover ConnectCraft</span>
            <h2 className="section-main-heading">How ConnectCraft Helps You Grow</h2>
            <p className="section-subtext">A continuous workflow designed to take you from meeting like-minded peers to launching collaborative projects.</p>
          </div>

          <div className="discover-grid-4">

            <div className="discover-card">
              <div className="discover-number">01</div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1C1917', marginBottom: '0.4rem' }}>Skill-Based Match</h3>
              <p style={{ fontSize: '0.85rem', color: '#57534E', lineHeight: 1.5 }}>Select your skills & interests to discover peers looking to swap knowledge and collaborate on shared goals.</p>
            </div>

            <div className="discover-card">
              <div className="discover-number">02</div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1C1917', marginBottom: '0.4rem' }}>Diverse Ecosystems</h3>
              <p style={{ fontSize: '0.85rem', color: '#57534E', lineHeight: 1.5 }}>Engage in vibrant community discussions, share curated learning materials, and join open project calls.</p>
            </div>

            <div className="discover-card">
              <div className="discover-number">03</div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1C1917', marginBottom: '0.4rem' }}>Team Workspaces</h3>
              <p style={{ fontSize: '0.85rem', color: '#57534E', lineHeight: 1.5 }}>Join active project teams, assign member roles, track milestones, and launch impactful projects.</p>
            </div>

            <div className="discover-card">
              <div className="discover-number">04</div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1C1917', marginBottom: '0.4rem' }}>Verified Reputation</h3>
              <p style={{ fontSize: '0.85rem', color: '#57534E', lineHeight: 1.5 }}>Build a portfolio of verified project contributions, achievement badges, and peer reviews.</p>
            </div>

          </div>

        </div>
      </section>

      {/* 5. PRODUCT SHOWCASE SECTION */}
      <section className="section-wrapper bg-section-gray" id="showcase">
        <div className="container">

          <div className="section-title-box">
            <span className="section-label">Authentic Product Preview</span>
            <h2 className="section-main-heading">Explore the ConnectCraft Workspaces</h2>
            <p className="section-subtext">Switch between tabs to see actual platform UI components and workflows.</p>
          </div>

          {/* Interactive Tabs */}
          <div className="showcase-tabs-nav">
            <button
              className={`showcase-tab-btn ${activeShowcaseTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveShowcaseTab('dashboard')}
            >
              Dashboard
            </button>
            <button
              className={`showcase-tab-btn ${activeShowcaseTab === 'communities' ? 'active' : ''}`}
              onClick={() => setActiveShowcaseTab('communities')}
            >
              Communities
            </button>
            <button
              className={`showcase-tab-btn ${activeShowcaseTab === 'projects' ? 'active' : ''}`}
              onClick={() => setActiveShowcaseTab('projects')}
            >
              Projects
            </button>
            <button
              className={`showcase-tab-btn ${activeShowcaseTab === 'workshops' ? 'active' : ''}`}
              onClick={() => setActiveShowcaseTab('workshops')}
            >
              Workshops
            </button>
            <button
              className={`showcase-tab-btn ${activeShowcaseTab === 'resources' ? 'active' : ''}`}
              onClick={() => setActiveShowcaseTab('resources')}
            >
              Resources
            </button>
            <button
              className={`showcase-tab-btn ${activeShowcaseTab === 'messaging' ? 'active' : ''}`}
              onClick={() => setActiveShowcaseTab('messaging')}
            >
              Messaging
            </button>
          </div>

          {/* Interactive Card Stage */}
          <div className="showcase-stage-card">

            {activeShowcaseTab === 'dashboard' && (
              <div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1C1917', marginBottom: '0.4rem' }}>Overview Dashboard Workspace</div>
                <div style={{ fontSize: '0.9rem', color: '#57534E', marginBottom: '1.25rem' }}>Provides quick access to your ongoing project workspaces, peer matches, recent notifications, and impact achievements.</div>

                <div className="showcase-stats-grid">
                  <div style={{ backgroundColor: '#FAFAF9', padding: '1rem', borderRadius: '12px', border: '1px solid #E7E5E4' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#78716C' }}>ACTIVE PROJECTS</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F766E', marginTop: '0.2rem' }}>Team Workspaces</div>
                  </div>
                  <div style={{ backgroundColor: '#FAFAF9', padding: '1rem', borderRadius: '12px', border: '1px solid #E7E5E4' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#78716C' }}>COMMUNITIES</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F766E', marginTop: '0.2rem' }}>Diverse Ecosystems</div>
                  </div>
                  <div style={{ backgroundColor: '#FAFAF9', padding: '1rem', borderRadius: '12px', border: '1px solid #E7E5E4' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#78716C' }}>IMPACT PROFILE</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#D97706', marginTop: '0.2rem' }}>Verified Reputation</div>
                  </div>
                </div>
              </div>
            )}

            {activeShowcaseTab === 'communities' && (
              <div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1C1917', marginBottom: '0.4rem' }}>Collaborative Communities Space</div>
                <div style={{ fontSize: '0.9rem', color: '#57534E', marginBottom: '1.25rem' }}>Join specialized interest ecosystems, participate in community discussions, share resources, and find collaborators.</div>

                <div className="showcase-communities-grid">
                  <div style={{ backgroundColor: '#FAFAF9', padding: '1rem', borderRadius: '12px', border: '1px solid #E7E5E4' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1C1917' }}>Music & Audio Production</div>
                    <div style={{ fontSize: '0.825rem', color: '#57534E', marginTop: '0.2rem' }}>Ableton Live, Sound Design, Mixing & Songwriting</div>
                  </div>
                  <div style={{ backgroundColor: '#FAFAF9', padding: '1rem', borderRadius: '12px', border: '1px solid #E7E5E4' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1C1917' }}>Software & Technology</div>
                    <div style={{ fontSize: '0.825rem', color: '#57534E', marginTop: '0.2rem' }}>Full-Stack Engineering, AI/ML, React & Cloud</div>
                  </div>
                </div>
              </div>
            )}

            {activeShowcaseTab === 'projects' && (
              <div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1C1917', marginBottom: '0.4rem' }}>Team Project Workspaces</div>
                <div style={{ fontSize: '0.9rem', color: '#57534E', marginBottom: '1.25rem' }}>Form project squads, recruit peer members with complementary skills, manage task milestones, and achieve your goals together.</div>

                <div style={{ backgroundColor: '#FAFAF9', padding: '1.25rem', borderRadius: '12px', border: '1px solid #E7E5E4' }}>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F766E', marginBottom: '0.35rem' }}>Collaborative Project Portal</div>
                  <div style={{ fontSize: '0.85rem', color: '#57534E', marginBottom: '0.85rem', lineHeight: 1.5 }}>Collaborate on real-world projects, share research data, and manage deliverables with peers.</div>
                  <Link to="/register" className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.45rem 1rem', borderRadius: '8px', textDecoration: 'none', display: 'inline-block' }}>View Project</Link>
                </div>
              </div>
            )}

            {activeShowcaseTab === 'workshops' && (
              <div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1C1917', marginBottom: '0.4rem' }}>Interactive Live Workshops</div>
                <div style={{ fontSize: '0.9rem', color: '#57534E', marginBottom: '1.25rem' }}>Host interactive skill workshops, peer sync meetings, and track attendee registration.</div>

                <div style={{ backgroundColor: '#FAFAF9', padding: '1rem', borderRadius: '12px', border: '1px solid #E7E5E4' }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1C1917' }}>Music Production & Audio Engineering Masterclass</div>
                  <div style={{ fontSize: '0.825rem', color: '#57534E', marginTop: '0.25rem' }}>Live interactive workshop covering sound synthesis, audio arrangement, and vocal mixing.</div>
                </div>
              </div>
            )}

            {activeShowcaseTab === 'resources' && (
              <div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1C1917', marginBottom: '0.4rem' }}>Knowledge Sharing Resource Space</div>
                <div style={{ fontSize: '0.9rem', color: '#57534E', marginBottom: '1.25rem' }}>Publish tutorials, reference guides, and curated links. Bookmark your favorites anytime.</div>

                <div style={{ backgroundColor: '#FAFAF9', padding: '1rem', borderRadius: '12px', border: '1px solid #E7E5E4' }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1C1917' }}>Comprehensive Peer Skill Sharing Guide</div>
                  <div style={{ fontSize: '0.825rem', color: '#57534E', marginTop: '0.25rem' }}>Curated documentation links, video tutorials, and reference examples.</div>
                </div>
              </div>
            )}

            {activeShowcaseTab === 'messaging' && (
              <div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1C1917', marginBottom: '0.4rem' }}>Real-time Peer Messaging</div>
                <div style={{ fontSize: '0.9rem', color: '#57534E', marginBottom: '1.25rem' }}>Direct 1-on-1 messaging and project team chat channels keep collaborators synced.</div>

                <div style={{ backgroundColor: '#FAFAF9', padding: '1rem', borderRadius: '12px', border: '1px solid #E7E5E4' }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1C1917' }}>Project Sync Chat</div>
                  <div style={{ fontSize: '0.825rem', color: '#57534E', marginTop: '0.25rem' }}>Real-time socket communication for peer reviews, task syncs, and direct messages.</div>
                </div>
              </div>
            )}

          </div>

        </div>
      </section>

      {/* 6. WHY CONNECTCRAFT (Comparison Section) */}
      <section className="section-wrapper" style={{ backgroundColor: '#FAFAF9' }}>
        <div className="container">

          <div className="section-title-box">
            <span className="section-label">Why ConnectCraft</span>
            <h2 className="section-main-heading">Built for Real Collaboration, Not Just Networking</h2>
            <p className="section-subtext">See how ConnectCraft compares to traditional professional networking platforms.</p>
          </div>

          <div className="comparison-container">

            {/* Traditional Networking */}
            <div className="comparison-column traditional">
              <div className="comparison-header">
                <span style={{ color: '#78716C' }}>Traditional Networking</span>
              </div>
              <div className="comparison-list">
                <div className="comparison-item">
                  <MinusCircle style={{ width: '20px', height: '20px', color: '#EF4444', flexShrink: 0, marginTop: '2px' }} />
                  <div><strong>Passive connections:</strong> Surface connections without shared project context or active collaboration.</div>
                </div>
                <div className="comparison-item">
                  <MinusCircle style={{ width: '20px', height: '20px', color: '#EF4444', flexShrink: 0, marginTop: '2px' }} />
                  <div><strong>Isolated learning:</strong> Studying in isolation without peer feedback or skill exchange.</div>
                </div>
                <div className="comparison-item">
                  <MinusCircle style={{ width: '20px', height: '20px', color: '#EF4444', flexShrink: 0, marginTop: '2px' }} />
                  <div><strong>Unverified profiles:</strong> Skill tags listed on profiles without verified contribution proof.</div>
                </div>
              </div>
            </div>

            {/* ConnectCraft */}
            <div className="comparison-column connectcraft">
              <div className="comparison-header">
                <span style={{ color: '#0F766E' }}>ConnectCraft Platform</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0F766E', backgroundColor: '#CCFBF1', padding: '0.2rem 0.55rem', borderRadius: '6px' }}>Recommended</span>
              </div>
              <div className="comparison-list">
                <div className="comparison-item">
                  <Check style={{ width: '20px', height: '20px', color: '#0F766E', flexShrink: 0, marginTop: '2px' }} />
                  <div><strong>Skill synergy match:</strong> Connect with peers based on complementary skills, shared interests, and goals.</div>
                </div>
                <div className="comparison-item">
                  <Check style={{ width: '20px', height: '20px', color: '#0F766E', flexShrink: 0, marginTop: '2px' }} />
                  <div><strong>Team project workspaces:</strong> Form project squads, assign tasks, and build real-world projects together.</div>
                </div>
                <div className="comparison-item">
                  <Check style={{ width: '20px', height: '20px', color: '#0F766E', flexShrink: 0, marginTop: '2px' }} />
                  <div><strong>Verified Impact reputation:</strong> Build a portfolio of verified peer contributions and achievements.</div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 7. CALL TO ACTION */}
      <section className="section-wrapper" style={{ backgroundColor: '#FAFAF9', paddingBottom: '5.5rem' }}>
        <div className="container" style={{ maxWidth: '960px' }}>
          <div className="cta-box">
            <h2 className="cta-heading">Ready to start building meaningful connections?</h2>
            <p style={{ color: '#A8A29E', fontSize: '1.05rem', maxWidth: '580px', margin: '0 auto 2.25rem', lineHeight: 1.6 }}>
              Join ConnectCraft today to connect with peers, collaborate on real-world projects, and elevate your skills.
            </p>
            <div className="cta-buttons">
              {isRegularUserLoggedIn ? (
                <Link to="/dashboard" className="btn-primary-emerald" style={{ padding: '0.85rem 2rem', fontSize: '1rem' }}>
                  Go to Dashboard <ArrowRight style={{ width: '18px', height: '18px' }} />
                </Link>
              ) : (
                <>
                  <Link to="/register" className="btn-primary-emerald" style={{ padding: '0.85rem 2rem', fontSize: '1rem' }}>
                    Join ConnectCraft <ArrowRight style={{ width: '18px', height: '18px' }} />
                  </Link>
                  <Link to="/login" className="btn-secondary-outline" style={{ padding: '0.85rem 2rem', fontSize: '1rem', backgroundColor: '#FFFFFF' }}>
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 8. FOOTER */}
      <footer className="site-footer">
        <div className="container">

          <div className="footer-top">

            {/* Left: Logo & Description */}
            <div>
              <a href="#home" style={{ textDecoration: 'none' }}>
                <Logo size="medium" showText={true} to={null} />
              </a>
              <p style={{ fontSize: '0.875rem', color: '#A8A29E', marginTop: '0.85rem', maxWidth: '320px', lineHeight: 1.6 }}>
                ConnectCraft is a community-driven platform for peer learning, skill exchange, interactive workshops, and collaborative projects.
              </p>
            </div>

            {/* Links Column 1: Navigation */}
            <div>
              <div className="footer-col-title">Navigation</div>
              <div className="footer-links">
                <a href="#features" className="footer-link">Features</a>
                <a href="#discover" className="footer-link">Discover</a>
                <a href="#showcase" className="footer-link">Showcase</a>
              </div>
            </div>

            {/* Links Column 2: Platform Modules */}
            <div>
              <div className="footer-col-title">Platform</div>
              <div className="footer-links">
                <a href="/communities" onClick={(e) => handlePlatformClick(e, 'communities', '/communities')} className="footer-link">Communities</a>
                <a href="/projects" onClick={(e) => handlePlatformClick(e, 'projects', '/projects')} className="footer-link">Projects</a>
                <a href="/workshops" onClick={(e) => handlePlatformClick(e, 'workshops', '/workshops')} className="footer-link">Workshops</a>
                <a href="/resources" onClick={(e) => handlePlatformClick(e, 'resources', '/resources')} className="footer-link">Resources</a>
              </div>
            </div>

            {/* Links Column 3: Connect & Social */}
            <div>
              <div className="footer-col-title">Connect</div>
              <div className="footer-links" style={{ marginBottom: '1.25rem' }}>
                {isRegularUserLoggedIn ? (
                  <Link to="/dashboard" className="footer-link">Go to Dashboard</Link>
                ) : (
                  <>
                    <Link to="/login" className="footer-link">Sign In</Link>
                    <Link to="/register" className="footer-link">Join ConnectCraft</Link>
                  </>
                )}
              </div>
            </div>

          </div>

          {/* Bottom Copyright Bar */}
          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.825rem', color: '#78716C', flexWrap: 'wrap', gap: '1rem' }}>
            <div>© {new Date().getFullYear()} ConnectCraft. All rights reserved.</div>
            <div>Built for community-driven learning and project collaboration.</div>
          </div>

        </div>
      </footer>

    </div>
  );
};

export default Landing;
