"use client";

import { motion } from "framer-motion";

type FeatureIconProps = {
  icon: "students" | "attendance" | "results" | "ai" | "parent-portal";
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  animated?: boolean;
};

const iconMap = {
  students: {
    path: "M12 6.572l9.572 9.572-9.572 9.572M6.573 6.573L0 16.145l9.573-9.572L6.573 6.573z",
    description: "Student and class management",
    color: "var(--color-sh-green-800)",
    bgColor: "var(--color-sh-green-50)",
  },
  attendance: {
    path: "M19.5 12c0-7.5-6.25-13.5-12-13.5C8.25 6.75 2.25 13.5 2.25 25.5c0 11.25 8.25 20.25 18.75 20.25s18.75-9 18.75-20.25c-10.5 0-18.75-9-18.75-20.25zM12 17.5v-6.75l3.75 3.75M12 6.25v6.75l-3.75-3.75",
    description: "Attendance tracking and student presence",
    color: "var(--color-sh-amber-500)",
    bgColor: "rgba(245,158,11,0.1)",
  },
  results: {
    path: "M9 12l2 2 4-4-4zM12 2.25C6.736 2.25 2.25 6.736 2.25 12c0 5.264 4.237 9.747 9.968 11.472a12.035 12.035 0 005.961 2.025v9.258a3.015 3.015 0 003.855 1.602l3.183 3.182a3.015 3.015 0 000 4.242l3.183 3.182a3.015 3.015 0 00-4.242-4.242l-1.056-1.056a12.05 12.05 0 00-17.045-8.475C12.25 12.495 9.25 9.75 6.25 9.75c-3 0-5.53 2.736-5.531 6.249z",
    description: "Result entry and grading",
    color: "var(--color-info)",
    bgColor: "rgba(56,189,248,0.1)",
  },
  ai: {
    path: "M13 10V4H7v4H4v4h4v4h4v-4H9M8 8h2.5M8 12h2.5M8 16h2.5",
    description: "AI lesson generation",
    color: "var(--color-sh-amber-500)",
    bgColor: "rgba(245,158,11,0.06)",
  },
  "parent-portal": {
    path: "M3.333 20.84c4.302-4.506 10.626-7.16 17.333-7.16s13.03 2.654 17.333 7.16c.833.848 2.068 2.924 2.57 4.872.695 2.068-.285 4.341-2.722 4.341-4.512-.052-1.942-1.157-3.617-2.2-4.954-3.351-1.876-4.759-2.683-3.643-.924-1.961-1.451-3.919-.836-6.331-2.88-10.572-5.962-12.753-9.311-5.262-1.486-10.202-.06-15.252-3.71-7.463-6.109C5.055 14.504 2.25 11.394 2.25 7.5c0-3.365 1.914-6.332 4.936-8.207 10.134-6.199 16.785-5.177 23.973 1.076 11.865 6.443 17.14 14.604 15.742 20.608.977 2.599-1.683 4.301-4.254 5.024-6.953.68 3.999 1.557-8.021 2.821-15.427-2.436-19.035-.411-1.414-1.438-2.828-2.845-4.258L12 8.045l-3.163 3.163M7.5 12.5H16",
    description: "Parent portal and communication",
    color: "var(--color-sh-green-600)",
    bgColor: "var(--color-sh-green-50)",
  },
};

function FeatureIcon({ icon, className = "", size = "md", animated = true }: FeatureIconProps) {
  const config = iconMap[icon];
  if (!config) {
    console.error(`FeatureIcon: Invalid icon "${icon}"`);
    return null;
  }

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  };

  const iconContent = (
    <svg
      width="24" height="24" viewBox="0 0 24 24" fill="none"
      stroke={config.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className={`${sizeClasses[size]} transition-all duration-300`}
    >
      <path d={config.path} />
    </svg>
  );

  if (!animated) {
    return (
      <div
        className={`inline-flex items-center justify-center rounded-xl ${sizeClasses[size]} ${className}`}
        style={{ backgroundColor: config.bgColor }}
      >
        {iconContent}
      </div>
    );
  }

  return (
    <motion.div
      className={`inline-flex items-center justify-center rounded-xl ${sizeClasses[size]} shadow-sm hover:shadow-md transition-all duration-300 ${className}`}
      style={{ backgroundColor: config.bgColor }}
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {iconContent}
    </motion.div>
  );
}

export default FeatureIcon;

// Helper component for feature card with icon
export function FeatureCard({ icon, title, description }: {
  icon: "students" | "attendance" | "results" | "ai" | "parent-portal";
  title: string;
  description: string;
}) {
  return (
    <motion.div
      className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] p-8 hover:shadow-lg transition-shadow duration-300"
      whileHover={{ y: -4 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="flex items-start gap-4">
        <FeatureIcon icon={icon} size="xl" animated />
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-[var(--heading-color)] mb-2">{title}</h3>
          <p className="text-[var(--body-color)] leading-relaxed">{description}</p>
        </div>
      </div>
    </motion.div>
  );
}