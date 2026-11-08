import { navigation } from "@/constants/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {

    const pathname= usePathname();
    return (
        <nav
            aria-label="Navigasi utama"
            className="dashboard-tabs"
        >
            {navigation.map((item) => (
                <Link
                    key={item.href}
                    href={item.href}
                    aria-current={
                        pathname.startsWith(item.href) ? "page" : undefined
                    }
                    className="dashboard-tab"
                >
                    {item.label}
                </Link>
            ))}
        </nav>
    )
}
