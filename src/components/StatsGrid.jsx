import { motion } from "framer-motion";
import { useAchievement } from "../context/AchievementContext";

/**
 * StatsGrid — Dashboard stats showing totals for certificates, badges, etc.
 */
export default function StatsGrid() {
  const { stats } = useAchievement();

  const items = [
    { label: "Total NFTs",    value: stats.total,        icon: "🏆", color: "#6366f1", gradient: "from-indigo-500 to-purple-600" },
    { label: "Certificates",  value: stats.certificates, icon: "🎓", color: "#8b5cf6", gradient: "from-violet-500 to-purple-600" },
    { label: "Badges",        value: stats.badges,       icon: "🏅", color: "#f59e0b", gradient: "from-amber-500 to-orange-500"  },
    { label: "Rewards",       value: stats.rewards,      icon: "⭐", color: "#10b981", gradient: "from-emerald-500 to-teal-500"  },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map((item, i) => (
        <motion.div
          key={item.label}
          className="stat-card border-gradient"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          whileHover={{ y: -3 }}
        >
          <div
            className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-xl`}
          >
            {item.icon}
          </div>
          <p className="text-3xl font-bold text-white font-display">{item.value}</p>
          <p className="text-sm text-slate-400">{item.label}</p>
        </motion.div>
      ))}
    </div>
  );
}
