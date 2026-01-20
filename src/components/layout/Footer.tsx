import Link from 'next/link'
import Image from 'next/image'
import { Instagram, Twitter, Mail, Heart } from 'lucide-react'

const footerLinks = {
  navigation: [
    { href: '/', label: 'Home' },
    { href: '/books', label: 'Books' },
    { href: '/about', label: 'About' },
    { href: '/gallery', label: 'Gallery' },
    { href: '/members', label: 'Members' },
  ],
  legal: [
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/terms', label: 'Terms of Service' },
  ],
}

const socialLinks = [
  { href: '#', icon: Instagram, label: 'Instagram' },
  { href: '#', icon: Twitter, label: 'Twitter' },
  { href: 'mailto:hello@tripleabookclub.com', icon: Mail, label: 'Email' },
]

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="relative mt-auto border-t border-white/10">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/50 to-transparent pointer-events-none" />

      <div className="relative container-main py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-6">
              <div className="relative w-12 h-12 overflow-hidden rounded-full ring-2 ring-primary-500/20">
                <Image
                  src="/logo.jpg"
                  alt="Triple A Book Club"
                  fill
                  className="object-cover"
                />
              </div>
              <span className="font-display text-2xl font-bold">
                <span className="text-gradient">Triple A</span>
                <span className="text-white/80 font-normal ml-1">Book Club</span>
              </span>
            </Link>
            <p className="text-white/60 max-w-md mb-6">
              A passionate community of book lovers exploring captivating stories 
              together. Join us on our literary journey through monthly fiction and 
              bi-monthly non-fiction reads.
            </p>
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all duration-300 hover:scale-110"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-display text-lg font-semibold text-white mb-6">
              Navigation
            </h4>
            <ul className="space-y-3">
              {footerLinks.navigation.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-white/60 hover:text-white transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-display text-lg font-semibold text-white mb-6">
              Stay Updated
            </h4>
            <p className="text-white/60 text-sm mb-4">
              Subscribe to get updates on our latest book picks and events.
            </p>
            <form className="space-y-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="input-field text-sm"
              />
              <button type="submit" className="btn-primary w-full text-sm">
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-16 pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-white/40 text-sm flex items-center gap-1">
              © {currentYear} Triple A Book Club. Made with 
              💛 
              for book lovers.
            </p>
            <ul className="flex items-center gap-6">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-white/40 hover:text-white/80 text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  )
}
