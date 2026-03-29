import { AccountSettingsCards, ChangePasswordCard, DeleteAccountCard } from "@daveyplate/better-auth-ui"


function Settings() {
    return (
        <div className="w-full p-4 flex justify-center items-center min-h-[90vh] flex-col gap-6">
            <AccountSettingsCards
                classNames={{
                    cards: "gap-6",
                    card: {
                        base: "bg-black/10  max-w-xl mx-auto",
                        footer: "bg-black/10 "
                    }
                }}
            />
            <div className="w-full">

                <ChangePasswordCard
                    classNames={{
                        base: "bg-black/10  max-w-xl mx-auto",
                        footer: "bg-black/10 "
                    }}
                />
            </div>

            <div className="w-full">

                <DeleteAccountCard
                    classNames={{
                        base: "bg-black/10  max-w-xl mx-auto",
                        footer: "bg-black/10 "
                    }}
                />
            </div>

        </div>
    )
}

export default Settings

// className="w-full p-4 flex justify-center items-center min-h-[90vh]"