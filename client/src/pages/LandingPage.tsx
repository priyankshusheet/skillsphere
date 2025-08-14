import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/UI/Button';
import { 
  AcademicCapIcon,
  ChartBarIcon,
  UserGroupIcon,
  RocketLaunchIcon,
  CheckCircleIcon,
  StarIcon
} from '@heroicons/react/24/outline';

const LandingPage: React.FC = () => {
  const features = [
    {
      name: 'AI-Powered Skills Assessment',
      description: 'Advanced machine learning algorithms analyze and assess employee skills with high accuracy.',
      icon: AcademicCapIcon,
    },
    {
      name: 'Real-time Analytics',
      description: 'Comprehensive dashboards and reports to track skills development and organizational growth.',
      icon: ChartBarIcon,
    },
    {
      name: 'Personalized Learning Paths',
      description: 'Custom learning recommendations based on individual skills gaps and career goals.',
      icon: UserGroupIcon,
    },
    {
      name: 'Market Demand Forecasting',
      description: 'Predict future skills demand and align your workforce with industry trends.',
      icon: RocketLaunchIcon,
    },
  ];

  const testimonials = [
    {
      content: "SkillSphere transformed how we approach talent development. The AI insights are incredibly accurate.",
      author: "Sarah Johnson",
      role: "HR Director",
      company: "TechCorp"
    },
    {
      content: "Our learning programs are now data-driven and highly effective. ROI has increased by 300%.",
      author: "Michael Chen",
      role: "Learning Manager",
      company: "InnovateLabs"
    },
    {
      content: "The skills gap analysis helped us identify critical training needs we didn't even know existed.",
      author: "Emily Rodriguez",
      role: "VP of People",
      company: "GrowthStart"
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="relative">
        <nav className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8" aria-label="Global">
          <div className="flex lg:flex-1">
            <Link to="/" className="-m-1.5 p-1.5">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">S</span>
                </div>
                <span className="ml-3 text-xl font-bold text-gray-900 dark:text-white">SkillSphere</span>
              </div>
            </Link>
          </div>
          <div className="flex gap-x-12">
            <Link to="/login" className="text-sm font-semibold leading-6 text-gray-900 dark:text-white">
              Sign in
            </Link>
            <Link to="/register">
              <Button variant="primary" size="sm">
                Get started
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
              AI-Powered Skills Mapping for{' '}
              <span className="text-blue-600">Modern Teams</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
              Transform your workforce with intelligent skills assessment, personalized learning paths, 
              and real-time analytics. Bridge the gap between current capabilities and future demands.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link to="/register">
                <Button size="lg">
                  Start free trial
                </Button>
              </Link>
              <Link to="/demo" className="text-sm font-semibold leading-6 text-gray-900 dark:text-white">
                Watch demo <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-blue-600">Advanced Analytics</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Everything you need to build a skills-first organization
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
            SkillSphere combines cutting-edge AI with proven learning methodologies to create 
            a comprehensive skills development platform that scales with your organization.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-2">
            {features.map((feature) => (
              <div key={feature.name} className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900 dark:text-white">
                  <feature.icon className="h-5 w-5 flex-none text-blue-600" aria-hidden="true" />
                  {feature.name}
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600 dark:text-gray-300">
                  <p className="flex-auto">{feature.description}</p>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-24 sm:py-32">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-lg font-semibold leading-8 tracking-tight text-blue-600">Testimonials</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Trusted by leading organizations
          </p>
        </div>
        <div className="mx-auto mt-16 flow-root max-w-2xl sm:mt-20 lg:mx-0 lg:max-w-none">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-50 dark:bg-gray-800 p-8 rounded-2xl">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-6">"{testimonial.content}"</p>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{testimonial.author}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{testimonial.role}, {testimonial.company}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to transform your workforce?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-blue-100">
              Join thousands of organizations already using SkillSphere to build stronger, 
              more skilled teams.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link to="/register">
                <Button variant="secondary" size="lg">
                  Get started for free
                </Button>
              </Link>
              <Link to="/contact" className="text-sm font-semibold leading-6 text-white">
                Contact sales <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900">
        <div className="mx-auto max-w-7xl px-6 py-12 md:flex md:items-center md:justify-between lg:px-8">
          <div className="flex justify-center space-x-6 md:order-2">
            <Link to="/privacy" className="text-gray-400 hover:text-gray-300">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-gray-400 hover:text-gray-300">
              Terms of Service
            </Link>
          </div>
          <div className="mt-8 md:order-1 md:mt-0">
            <p className="text-center text-xs leading-5 text-gray-400">
              &copy; 2024 SkillSphere. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
