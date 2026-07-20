//HELLO I AM SKIDDED I AM A SKIDDED LITTLE BOY I AM THE SEX OFFENDER REGISTERY FOR ALL YOU NAUGHTY BOYS LIKE SHUSH DUCKLESS AND XHUNTER
let offenders = [];

async function loadRegistry() {

    const ids = await fetch("data/registry/index.json")
        .then(r => r.json());

    offenders = await Promise.all(
        ids.map(id =>
            fetch(`data/registry/${id}.json`)
                .then(r => r.json())
        )
    );

    render(offenders);
}


function render(list) {

    const container = document.getElementById("registry");

    container.innerHTML = "";

    list.forEach(person => {

        let evidenceHTML = "";

        if (person.evidence.length === 0) {
            evidenceHTML = "<li>No public evidence listed.</li>";
        } else {

            person.evidence.forEach(ev => {

                evidenceHTML += `
                    <li>
                        <a href="${ev.url}" target="_blank">
                            ${ev.title}
                        </a>
                    </li>
                `;

            });

        }

        container.innerHTML += `
            <div class="card">

                <h2>${person.username}</h2>

                <p><b>UserID:</b> ${person.userid}</p>

                <p><b>Known Alts:</b>
                    ${person.alts.map(alt =>
            `<span class="wiki-cat">${alt}</span>`
        ).join(" ")}
                </p>

                <p><b>Offenses:</b>
                    ${person.offenses.map(offense =>
            `<span class="wiki-cat">${offense}</span>`
        ).join(" ")}
                </p>

                <p><b>Description:</b> ${person.description}</p>

                <h4>Evidence</h4>

                <ul>
                    ${evidenceHTML}
                </ul>

            </div>
        `;

    });

}

document.getElementById("registrySearch").addEventListener("input", e => {

    const search = e.target.value.toLowerCase();

    render(
        offenders.filter(person =>

            person.username.toLowerCase().includes(search) ||

            person.offenses.some(offense =>
                offense.toLowerCase().includes(search)
            ) ||

            person.userid.toString().includes(search)

        )
    );

});

loadRegistry();