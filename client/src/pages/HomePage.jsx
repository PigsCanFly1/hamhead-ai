import React, { useState } from 'react';
import { useApps, useCampaign, useSubscribe } from '../hooks/useApps';
import { Github, ExternalLink, CheckCircle, Menu, X } from 'lucide-react';

const categories = ['ALL', 'ECONOMIC', 'SPIRITUAL', 'SOCIAL', 'PERSONAL', 'TECHNICAL'];

const categoryColors = {
  ECONOMIC: 'bg-wheat/20 text-soil',
  SPIRITUAL: 'bg-deep/10 text-deep',
  SOCIAL: 'bg-neon/20 text-soil',
  PERSONAL: 'bg-rust/10 text-rust',
  TECHNICAL: 'bg-soil/10 text-soil',
};

const statusColors = {
  RELEASED: 'bg-neon/20 text-green-700',
  BETA: 'bg-wheat/30 text-soil',
  DEVELOPMENT: 'bg-rust/10 text-rust',
  ARCHIVED: 'bg-gray-200 text-gray-500',
};

const HomePage = () => {
  const [filter, setFilter] = useState('ALL');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [contactSent, setContactSent] = useState(false);

  const { data: appsData, isLoading: appsLoading } = useApps({ category: filter });
  const { data: campaign, isLoading: campaignLoading } = useCampaign();
  const subscribe = useSubscribe();

  const handleSubscribe = (e) => {
    e.preventDefault();
    subscribe.mutate({ email, name }, {
      onSuccess: () => {
        setEmail('');
        setName('');
      },
    });
  };

  const handleContact = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm),
      });
      if (res.ok) {
        setContactSent(true);
        setContactForm({ name: '', email: '', subject: '', message: '' });
      }
    } catch (err) {
      console.error('Contact error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-cloud">

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 w-full z-50 bg-soil/95 backdrop-blur-md text-white px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-wheat rounded-full flex items-center justify-center">
              <span className="text-soil font-display font-black text-sm">HH</span>
            </div>
            <span className="font-display font-bold text-lg tracking-tight">HAM-HEAD AI</span>
          </div>

          <div className="hidden md:flex items-center gap-8 font-mono text-sm">
            {['#sole', '#campaign', '#apps', '#contact'].map((href) => (
              <a key={href} href={href} className="hover:text-wheat transition-colors uppercase tracking-widest text-xs">
                {href.replace('#', '')}
              </a>
            ))}
          </div>

          <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-white/10 pt-4 space-y-3 font-mono text-sm">
            {['#sole', '#campaign', '#apps', '#contact'].map((href) => (
              <a key={href} href={href} className="block hover:text-wheat uppercase tracking-widest text-xs"
                onClick={() => setMobileMenuOpen(false)}>
                {href.replace('#', '')}
              </a>
            ))}
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="pt-32 pb-20 px-6 bg-cloud relative overflow-hidden">
        {/* Background grain texture */}
        <div className="absolute inset-0 opacity-5 pointer-events-none"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }} />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="font-mono text-rust text-xs tracking-widest mb-6 flex items-center gap-2">
              <span className="w-2 h-2 bg-rust rounded-full animate-pulse" />
              A DIVISION OF MOZART SOFTWARE ARCHITECTS
            </div>

            <h1 className="text-7xl md:text-9xl font-display font-black mb-4 leading-none text-soil tracking-tighter">
              HAM-<br/>HEAD<br/>AI
            </h1>

            <div className="w-24 h-1 bg-rust mb-6" />

            <h2 className="text-2xl md:text-3xl font-display font-bold mb-6 text-soil leading-tight">
              MIDWEST ROOTS.<br/>
              <span className="text-rust">SYNTHESISTIC MINDS.</span>
            </h2>

            <p className="text-lg text-soil/70 mb-8 leading-relaxed max-w-lg">
              We engineer <span className="font-semibold text-soil">S.O.L.E. Environments</span> — where advanced autodidactic Human Intelligence collaborates with Agentic Intelligence to create universally beneficial solutions.
            </p>

            <div className="flex flex-wrap gap-4">
              <a href="#sole"
                className="bg-soil text-white px-8 py-4 rounded-full font-display font-bold hover:bg-rust transition-all duration-300 text-sm tracking-wide">
                EXPLORE S.O.L.E.
              </a>
              <a href="#campaign"
                className="border-2 border-soil text-soil px-8 py-4 rounded-full font-display font-bold hover:bg-soil hover:text-white transition-all duration-300 text-sm tracking-wide">
                100 DAYS CAMPAIGN
              </a>
            </div>
          </div>

          {/* Campaign Stats Card */}
          <div className="relative">
            <div className="absolute -top-8 -right-8 w-64 h-64 bg-wheat/20 rounded-full blur-3xl" />
            <div className="relative bg-white rounded-3xl p-8 shadow-2xl gradient-border">
              <div className="font-mono text-xs text-rust mb-1 tracking-widest">◉ LIVE SYSTEM STATUS</div>
              {campaignLoading ? (
                <div className="space-y-3 mt-4">
                  {[1, 2, 3].map(i => <div key={i} className="h-10 bg-cloud rounded-lg animate-pulse" />)}
                </div>
              ) : campaign ? (
                <>
                  <div className="text-4xl font-display font-black mb-6 text-soil">
                    DAY {campaign.currentDay}<span className="text-rust text-2xl">/{campaign.totalDays}</span>
                  </div>

                  <div className="space-y-3 mb-6">
                    {[
                      { label: 'Apps Released', value: campaign.appsReleased, color: 'text-neon' },
                      { label: 'Days Remaining', value: campaign.stats?.daysRemaining ?? 77, color: 'text-soil' },
                      { label: 'Progress', value: `${campaign.stats?.progress?.toFixed(1) ?? 23}%`, color: 'text-rust' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="flex justify-between items-center p-3 bg-cloud rounded-xl">
                        <span className="font-mono text-xs text-soil/60 uppercase tracking-wider">{label}</span>
                        <span className={`font-display font-bold text-xl ${color}`}>{value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="w-full bg-cloud h-3 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-rust to-wheat h-full rounded-full transition-all duration-1000"
                      style={{ width: `${campaign.stats?.progress ?? 23}%` }}
                    />
                  </div>
                  <div className="flex justify-between font-mono text-xs text-soil/40 mt-2">
                    <span>0</span>
                    <span>100 APPS</span>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* ── MARQUEE TICKER ── */}
      <div className="bg-rust py-3 overflow-hidden border-y-2 border-soil">
        <div className="marquee-content whitespace-nowrap font-mono text-sm text-white">
          {Array(4).fill('  ◉ SYNTHESISTIC ORGANIC LEARNING ENVIRONMENT  ✦  100 DAYS · 100 APPS  ✦  MIDWEST AGENTIC INTELLIGENCE  ✦  HAM-HEAD AI  ✦  S.O.L.E.  ✦  MOZART SOFTWARE ARCHITECTS  ✦').join('')}
        </div>
      </div>

      {/* ── S.O.L.E. ── */}
      <section id="sole" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16">
            <div className="font-mono text-xs text-rust tracking-widest mb-4">PHILOSOPHY</div>
            <h2 className="text-6xl md:text-8xl font-display font-black text-soil mb-6 leading-none">S.O.L.E.</h2>
            <p className="text-xl text-soil/60 max-w-2xl leading-relaxed">
              <span className="font-semibold text-rust">Synthesistic Organic Learning Environment</span> — where advanced autodidactic Human Intelligence collaborates with Agentic Intelligence to develop universally beneficial solutions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { letter: 'S', word: 'SYNTHESISTIC', color: 'bg-wheat', desc: 'The fusion of autodidactic human insight with agentic computational power creates something neither could achieve alone.' },
              { letter: 'O', word: 'ORGANIC', color: 'bg-neon/30', desc: 'Natural growth patterns over forced automation. Sustainable, emergent development rooted in real human need.' },
              { letter: 'L', word: 'LEARNING', color: 'bg-rust/20', desc: 'Autodidactic human intelligence meeting machine learning — a perpetual feedback loop of mutual growth.' },
              { letter: 'E', word: 'ENVIRONMENT', color: 'bg-deep/10', desc: 'The collaborative context where universal benefit emerges — not a product, but a living ecosystem.' },
            ].map((item, i) => (
              <div key={item.letter}
                className={`p-8 rounded-2xl hover:shadow-2xl transition-all duration-300 group ${item.color} ${i % 2 === 1 ? 'lg:mt-10' : ''}`}>
                <div className="text-6xl font-display font-black text-soil/20 mb-2 group-hover:text-soil/40 transition-colors">
                  {item.letter}
                </div>
                <h3 className="font-mono text-xs font-bold tracking-widest text-soil mb-3">{item.word}</h3>
                <p className="text-soil/70 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CAMPAIGN ── */}
      <section id="campaign" className="py-24 bg-soil text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-rust/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-wheat/5 rounded-full blur-2xl" />

        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-rust/30 border border-rust/50 rounded-full font-mono text-xs mb-8">
                <span className="w-2 h-2 bg-neon rounded-full animate-pulse" />
                LIVE CAMPAIGN
              </div>

              <h2 className="text-6xl md:text-8xl font-display font-black mb-6 leading-none">
                100<br/>DAYS<br/><span className="text-wheat">100 APPS</span>
              </h2>

              <p className="text-xl text-white/60 mb-10 leading-relaxed max-w-md">
                Ham-Head AI commits to the development and release of 100 AI-powered applications in 100 days. All that we do is for the benefit of you.
              </p>

              {!campaignLoading && campaign && (
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'DAYS IN', value: campaign.stats?.daysElapsed ?? 23, color: 'text-neon' },
                    { label: 'APPS LIVE', value: campaign.appsReleased, color: 'text-wheat' },
                    { label: 'DAYS LEFT', value: campaign.stats?.daysRemaining ?? 77, color: 'text-white' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="text-center p-5 bg-white/5 rounded-2xl border border-white/10 hover:border-white/20 transition-colors">
                      <div className={`text-4xl font-display font-black ${color}`}>{value}</div>
                      <div className="font-mono text-xs text-white/40 mt-2 tracking-widest">{label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Latest Release Card */}
            <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-8 border border-white/10">
              <div className="font-mono text-xs text-wheat tracking-widest mb-6">◉ LATEST RELEASE</div>

              <div className="space-y-4">
                {appsData?.apps
                  ?.filter(a => a.status === 'RELEASED')
                  ?.slice(-3)
                  ?.reverse()
                  ?.map((app, i) => (
                    <div key={app.id}
                      className={`p-5 rounded-2xl border transition-all ${i === 0 ? 'bg-white/10 border-white/20' : 'bg-white/5 border-white/10'}`}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-mono text-xs bg-neon text-soil px-2 py-1 rounded font-bold">
                          DAY {app.day}
                        </span>
                        <span className="text-xs text-white/30 font-mono">{app.category}</span>
                      </div>
                      <h4 className="text-lg font-display font-bold mb-1">{app.name}</h4>
                      <p className="text-white/50 text-sm line-clamp-2">{app.description}</p>
                    </div>
                  )) ?? (
                  <div className="p-5 rounded-2xl bg-white/10 border border-white/20">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-mono text-xs bg-neon text-soil px-2 py-1 rounded font-bold">DAY 23</span>
                      <span className="text-xs text-white/30 font-mono">ECONOMIC</span>
                    </div>
                    <h4 className="text-xl font-display font-bold mb-2">EthiCalc</h4>
                    <p className="text-white/60 text-sm">Native Ethical Intelligence calculator for transparent AI decision-making auditing.</p>
                    <div className="flex gap-2 mt-3">
                      {['ethics', 'finance', 'transparency'].map(tag => (
                        <span key={tag} className="px-2 py-1 bg-white/10 rounded text-xs font-mono">{tag}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── APPS GRID ── */}
      <section id="apps" className="py-24 bg-cloud">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12">
            <div>
              <div className="font-mono text-xs text-rust tracking-widest mb-4">THE PORTFOLIO</div>
              <h2 className="text-5xl md:text-7xl font-display font-black text-soil leading-none">
                THE<br/>APPLICATIONS
              </h2>
              <p className="text-xl text-soil/50 mt-4">Tools to grow your pockets and your mind.</p>
            </div>

            <div className="flex gap-2 mt-8 md:mt-0 flex-wrap justify-end">
              {categories.map(cat => (
                <button key={cat} onClick={() => setFilter(cat)}
                  className={`px-4 py-2 rounded-full border-2 font-mono text-xs tracking-widest transition-all duration-200 ${
                    filter === cat
                      ? 'bg-soil text-white border-soil'
                      : 'border-soil/30 text-soil/60 hover:border-soil hover:text-soil'
                  }`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {appsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-72 bg-white animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : appsData?.apps?.length === 0 ? (
            <div className="text-center py-24 text-soil/40 font-mono">
              No applications in this category yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {appsData?.apps?.map((app) => (
                <div key={app.id} className="app-card bg-white rounded-2xl overflow-hidden shadow-sm border border-soil/8 group">
                  {/* Card Header */}
                  <div className="h-28 relative overflow-hidden"
                    style={{
                      background: app.category === 'SPIRITUAL' ? 'linear-gradient(135deg, #0A0E27, #2C1810)' :
                        app.category === 'ECONOMIC' ? 'linear-gradient(135deg, #F4D03F, #B7410E)' :
                          app.category === 'SOCIAL' ? 'linear-gradient(135deg, #00FF88, #0A0E27)' :
                            app.category === 'TECHNICAL' ? 'linear-gradient(135deg, #2C1810, #B7410E)' :
                              'linear-gradient(135deg, #F9F7F0, #F4D03F)'
                    }}>
                    <div className="absolute inset-0 opacity-20"
                      style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, white 0%, transparent 60%)' }} />
                    <div className="absolute bottom-4 left-4">
                      <span className="font-mono text-xs text-white/80 bg-black/30 px-3 py-1 rounded-full backdrop-blur-sm">
                        DAY {app.day}
                      </span>
                    </div>
                    <div className="absolute top-4 right-4">
                      <span className={`text-xs px-2 py-1 rounded font-mono font-bold ${statusColors[app.status] || 'bg-gray-200 text-gray-600'}`}>
                        {app.status}
                      </span>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-display text-xl font-bold text-soil group-hover:text-rust transition-colors">
                        {app.name}
                      </h3>
                      <span className={`text-xs font-mono px-2 py-1 rounded ${categoryColors[app.category] || 'bg-gray-100'}`}>
                        {app.category}
                      </span>
                    </div>

                    <p className="text-sm text-soil/60 mb-4 leading-relaxed line-clamp-3">{app.description}</p>

                    <div className="flex flex-wrap gap-2 mb-5">
                      {app.tags?.slice(0, 3).map(tag => (
                        <span key={tag} className="px-2 py-1 bg-cloud rounded-full text-xs font-mono text-soil/50">
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-soil/8">
                      <div className="flex gap-1">
                        {app.githubUrl && (
                          <a href={app.githubUrl} target="_blank" rel="noopener noreferrer"
                            className="p-2 hover:bg-cloud rounded-lg transition-colors text-soil/40 hover:text-soil">
                            <Github size={16} />
                          </a>
                        )}
                        {app.demoUrl && (
                          <a href={app.demoUrl} target="_blank" rel="noopener noreferrer"
                            className="p-2 hover:bg-cloud rounded-lg transition-colors text-soil/40 hover:text-soil">
                            <ExternalLink size={16} />
                          </a>
                        )}
                      </div>
                      {app.releaseDate && (
                        <span className="font-mono text-xs text-soil/30">
                          {new Date(app.releaseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination hint */}
          {appsData?.pagination && appsData.pagination.pages > 1 && (
            <div className="text-center mt-12 font-mono text-sm text-soil/40">
              Showing {appsData.apps.length} of {appsData.pagination.total} applications
            </div>
          )}
        </div>
      </section>

      {/* ── NEWSLETTER ── */}
      <section className="py-24 bg-wheat">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="font-mono text-xs text-rust tracking-widest mb-4">STAY IN THE LOOP</div>
          <h2 className="text-5xl md:text-7xl font-display font-black mb-6 text-soil leading-none">
            JOIN THE<br/>JOURNEY
          </h2>
          <p className="text-xl text-soil/60 mb-12 max-w-lg mx-auto">
            Follow Ham-Head AI as we take AI to the people. Subscribe for daily updates on new releases.
          </p>

          {subscribe.isSuccess ? (
            <div className="flex items-center justify-center gap-3 text-soil bg-white/50 rounded-2xl py-6 px-8 max-w-md mx-auto">
              <CheckCircle size={24} className="text-rust" />
              <span className="font-display font-bold">Welcome to the Ham-Head AI journey!</span>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
              <input type="text" placeholder="Your name (optional)" value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 px-6 py-4 rounded-full bg-white border-2 border-soil/20 text-soil placeholder-soil/40 focus:outline-none focus:border-soil font-mono text-sm" />
              <input type="email" placeholder="Email address" required value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-6 py-4 rounded-full bg-white border-2 border-soil/20 text-soil placeholder-soil/40 focus:outline-none focus:border-soil font-mono text-sm" />
              <button type="submit" disabled={subscribe.isPending}
                className="px-8 py-4 bg-soil text-white rounded-full font-display font-bold hover:bg-rust transition-all disabled:opacity-50 whitespace-nowrap text-sm tracking-wide">
                {subscribe.isPending ? '...' : 'SUBSCRIBE'}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact" className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="font-mono text-xs text-rust tracking-widest mb-4">GET IN TOUCH</div>
            <h2 className="text-5xl md:text-7xl font-display font-black text-soil leading-none">CONTACT</h2>
          </div>

          {contactSent ? (
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-soil">
              <CheckCircle size={48} className="text-neon" />
              <h3 className="font-display text-2xl font-bold">Message Received!</h3>
              <p className="text-soil/60 font-mono text-sm">We'll respond to your inquiry shortly.</p>
              <button onClick={() => setContactSent(false)}
                className="mt-4 px-6 py-3 border-2 border-soil rounded-full font-mono text-sm hover:bg-soil hover:text-white transition-all">
                SEND ANOTHER
              </button>
            </div>
          ) : (
            <form onSubmit={handleContact} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { key: 'name', label: 'NAME', type: 'text', required: true, full: false },
                { key: 'email', label: 'EMAIL', type: 'email', required: true, full: false },
                { key: 'subject', label: 'SUBJECT', type: 'text', required: false, full: true },
              ].map(({ key, label, type, required, full }) => (
                <div key={key} className={full ? 'md:col-span-2' : ''}>
                  <label className="font-mono text-xs text-soil/50 tracking-widest block mb-2">{label}</label>
                  <input type={type} required={required}
                    value={contactForm[key]}
                    onChange={(e) => setContactForm(p => ({ ...p, [key]: e.target.value }))}
                    className="w-full px-5 py-4 rounded-xl border-2 border-soil/10 bg-cloud text-soil font-mono text-sm focus:outline-none focus:border-rust transition-colors" />
                </div>
              ))}

              <div className="md:col-span-2">
                <label className="font-mono text-xs text-soil/50 tracking-widest block mb-2">MESSAGE</label>
                <textarea required rows={5}
                  value={contactForm.message}
                  onChange={(e) => setContactForm(p => ({ ...p, message: e.target.value }))}
                  className="w-full px-5 py-4 rounded-xl border-2 border-soil/10 bg-cloud text-soil font-mono text-sm focus:outline-none focus:border-rust transition-colors resize-none" />
              </div>

              <div className="md:col-span-2 flex justify-end">
                <button type="submit"
                  className="px-10 py-4 bg-soil text-white rounded-full font-display font-bold hover:bg-rust transition-all text-sm tracking-wide">
                  SEND MESSAGE →
                </button>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-soil text-white py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-wheat rounded-full flex items-center justify-center">
              <span className="text-soil font-display font-black text-xs">HH</span>
            </div>
            <span className="font-display font-bold tracking-tight">HAM-HEAD AI</span>
          </div>

          <div className="font-mono text-xs text-white/30 text-center">
            HAM-HEAD AI • A DIVISION OF MOZART SOFTWARE ARCHITECTS • MIDWEST, USA
          </div>

          <div className="flex gap-6 font-mono text-xs text-white/40">
            <a href="#sole" className="hover:text-wheat transition-colors">S.O.L.E.</a>
            <a href="#campaign" className="hover:text-wheat transition-colors">100/100</a>
            <a href="#apps" className="hover:text-wheat transition-colors">APPS</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
