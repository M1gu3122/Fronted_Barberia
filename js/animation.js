
document.addEventListener("DOMContentLoaded", () => {

    const prefersReducedMotion =
        window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;

    const video =
        document.querySelector("#bg-video");

    const card =
        document.querySelector("#login-card");

    const items =
        document.querySelectorAll(".stagger-item");

    const primaryButton =
        document.querySelector("#primary-button");


    if (!prefersReducedMotion) {

        const timeline = gsap.timeline();


        /*
         * Initial state
         */

        gsap.set(video, {
            opacity: 0
        });

        gsap.set(card, {
            y: 40,
            opacity: 0
        });

        gsap.set(items, {
            y: 20,
            opacity: 0
        });


        /*
         * Reveal animation
         */

        timeline
            .to(video, {
                opacity: 1,
                duration: 2,
                ease: "power2.inOut"
            })

            .to(
                card,
                {
                    y: 0,
                    opacity: 1,
                    duration: 1,
                    ease: "power3.out"
                },
                "-=1"
            )

            .to(
                items,
                {
                    y: 0,
                    opacity: 1,
                    duration: 0.8,
                    stagger: 0.15,
                    ease: "power2.out"
                },
                "-=0.6"
            );


        /*
         * Button hover animation
         */

        if (primaryButton) {

            primaryButton.addEventListener(
                "mouseenter",
                () => {

                    gsap.to(primaryButton, {
                        scale: 1.02,
                        boxShadow:
                            "0 0 20px rgba(197,160,89,0.4)",
                        duration: 0.3,
                        ease: "power1.out"
                    });

                }
            );


            primaryButton.addEventListener(
                "mouseleave",
                () => {

                    gsap.to(primaryButton, {
                        scale: 1,
                        boxShadow:
                            "0 0 0 rgba(197,160,89,0)",
                        duration: 0.3,
                        ease: "power1.out"
                    });

                }
            );

        }

    } else {

        gsap.set(
            [video, card, ...items],
            {
                opacity: 1,
                y: 0
            }
        );

    }

});
