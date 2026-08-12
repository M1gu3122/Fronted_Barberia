
document.addEventListener("DOMContentLoaded", () => {

    gsap.set("#background", {
        scale: 1.05,
        opacity: 0
    });

    gsap.set("#form-container", {
        y: 30,
        opacity: 0
    });

    gsap.set(".stagger-item", {
        y: 20,
        opacity: 0
    });


    const timeline = gsap.timeline();


    timeline
        .to("#background", {
            scale: 1,
            opacity: 1,
            duration: 1.5,
            ease: "power2.out"
        })

        .to(
            "#form-container",
            {
                y: 0,
                opacity: 1,
                duration: 0.8,
                ease: "power3.out"
            },
            "-=1"
        )

        .to(
            ".stagger-item",
            {
                y: 0,
                opacity: 1,
                duration: 0.6,
                stagger: 0.1,
                ease: "power2.out"
            },
            "-=0.4"
        );

});

