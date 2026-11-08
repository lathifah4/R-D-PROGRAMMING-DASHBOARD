import { navigation } from "@/constants/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";
import {
    TelevisionSimpleIcon,
    ArticleIcon,
    InfoIcon,
} from "@phosphor-icons/react";
import { cn } from "cn";


const icons = [
    TelevisionSimpleIcon,
    ArticleIcon,
];

export default function Sidebar() {
    const pathname = usePathname();
    return (
        <aside
            className="hidden w-20.5 shrink-0 flex-col items-center justify-between bg-white pt-8 pb-6 md:flex md:px-2 lg:px-4"
            aria-label="Pintasan halaman"
        >
            <div className="sticky top-6 rounded-full bg-zinc-50 p-1.5">
                {navigation.map((item, index) => {
                    const Icon = icons[index];

                    const isActive =
                        pathname === item.href ||
                        pathname.startsWith(`${item.href}/`);

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            aria-label={item.label}
                            title={item.description}
                            aria-current={isActive ? "page" : undefined}
                            className={cn(
                                "my-1 grid h-11 w-10.5 place-items-center rounded-full text-zinc-500 transition-colors duration-150 hover:bg-red-50 hover:text-red-700",
                                isActive && "bg-red-100 text-red-600"
                            )}
                        >
                            <Icon
                                size={21}
                                weight={isActive ? "fill" : "regular"}
                                aria-hidden="true"
                            />
                        </Link>
                    );
                })}
            </div>
            <DialogTrigger
                render={
                    <Button
                        variant="ghost"
                        size="icon"
                        className="my-1 grid h-11 w-10.5 place-items-center rounded-full p-0 text-zinc-500 hover:bg-red-50 hover:text-red-700"
                    />
                }
                aria-label="Panduan"
                title="Panduan"
            >
                <InfoIcon size={22} aria-hidden="true" />
            </DialogTrigger>
        </aside>

    )
}
