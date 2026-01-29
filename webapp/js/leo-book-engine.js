// leo-book-engine.js
const LEO_BOOK = {

    data: null,
    chapterIndex: 0,
    sectionIndex: 0,

    dom: {
        title: $("#book-title"),
        pageTitle: $("#page-title"),
        chapterList: $("#chapterList"),
        breadcrumb: $("#breadcrumb"),
        reader: $("#readerCard")
    },

    init() {
        this.loadBook();

        // react to manual hash change
        window.addEventListener("hashchange", () => {
            this.routeFromHash();
        });
    },

    loadBook() {
        $.getJSON("./data/book-demo.json")
            .done(json => {
                this.data = json;
                this.renderBookMeta();
                this.renderChapterList();
                // this.loadSection(0, 0);

                // route after JSON ready
                this.routeFromHash();
            })
            .fail(() => {
                alert("Failed to load book JSON");
            });
    },

    /* ======================================================
       ROUTER
    ====================================================== */

    routeFromHash() {

        const hash = window.location.hash;

        // default
        if (!hash || !hash.startsWith("#book$")) {
            this.loadSection(0, 0);
            return;
        }

        /**
         * Expected:
         * #book$book_id$section_id
         */
        const parts = hash.replace("#", "").split("$");

        if (parts.length !== 3) {
            console.warn("Invalid hash format");
            this.loadSection(0, 0);
            return;
        }

        const [, bookId, sectionId] = parts;

        // ensure correct book
        if (this.data.book?.book_id !== bookId) {
            console.warn("Book ID mismatch");
            this.loadSection(0, 0);
            return;
        }

        // find section
        const position = this.findSectionById(sectionId);

        if (!position) {
            console.warn("Section not found:", sectionId);
            this.loadSection(0, 0);
            return;
        }

        this.loadSection(position.cIndex, position.sIndex);
    },

    /* ======================================================
       FIND SECTION
    ====================================================== */

    findSectionById(sectionId) {

        for (let c = 0; c < this.data.chapters.length; c++) {
            const chapter = this.data.chapters[c];

            for (let s = 0; s < chapter.sections.length; s++) {
                if (chapter.sections[s].section_id === sectionId) {
                    return { cIndex: c, sIndex: s };
                }
            }
        }

        return null;
    },

    renderBookMeta() {
        const book = this.data.book || {};

        this.dom.title.text(book.title || "LEO LIVE BOOK");
        this.dom.pageTitle.text(
            (book.title || "LEO LIVE BOOK") + " | AI Learning"
        );
    },

    /* ===========================
       Chapters + Sections
    ============================ */

    renderChapterList() {

        const chapters = this.data.chapters || [];
        this.dom.chapterList.empty();

        chapters.forEach((chapter, cIndex) => {

            const chapterEl = $(`
                <div class="mb-2">
                    <div class="fw-semibold text-light small mb-1">
                        ${chapter.chapter_number}. ${chapter.chapter_title}
                    </div>
                </div>
            `);

            (chapter.sections || []).forEach((section, sIndex) => {

                const sectionEl = $(`
                    <a href="#"
                       class="ps-3 d-block small"
                       data-c="${cIndex}"
                       data-s="${sIndex}">
                        ${section.section_number} ${section.section_title}
                    </a>
                `);

                sectionEl.on("click", e => {
                    e.preventDefault();
                    this.loadSection(cIndex, sIndex, true);
                });

                chapterEl.append(sectionEl);
            });

            this.dom.chapterList.append(chapterEl);
        });
    },

    /* ===========================
       Load Section
    ============================ */

    loadSection(cIndex, sIndex, updateHash = false) {

        const chapter = this.data.chapters?.[cIndex];
        const section = chapter?.sections?.[sIndex];

        if (!chapter || !section) return;

        this.chapterIndex = cIndex;
        this.sectionIndex = sIndex;

        this.renderBreadcrumb(chapter, section);
        this.renderReader(section);
        this.highlightSection(cIndex, sIndex);

        // update URL
        if (updateHash) {
            const bookId = this.data.book.book_id;
            window.location.hash =
                `book$${bookId}$${section.section_id}`;
        }
    },

    /* ===========================
       Breadcrumb
    ============================ */

    renderBreadcrumb(chapter, section) {
        this.dom.breadcrumb.html(`
            <li class="breadcrumb-item">${chapter.chapter_title}</li>
            <li class="breadcrumb-item active">
                ${section.section_number} ${section.section_title}
            </li>
        `);
    },

    /* ===========================
       Reader
    ============================ */

    renderReader(section) {

        const summary = section.summary || "";
        const keywords = Array.isArray(section.keywords)
            ? section.keywords
            : [];

        const content = Array.isArray(section.content)
            ? section.content
            : [];

        const video = section.summary_video?.youtube_id
            ? `
                <div class="ratio ratio-16x9 my-4 rounded overflow-hidden">
                    <iframe
                        src="https://www.youtube.com/embed/${section.summary_video.youtube_id}"
                        allowfullscreen>
                    </iframe>
                </div>
              `
            : "";

        const paragraphs = content.map(p => `<p>${p}</p>`).join("");
        const tags = keywords.map(k => `<span class="tag">${k}</span>`).join("");

        this.dom.reader.html(`
            <h1 class="mb-3">${section.section_title}</h1>
            <p class="lead">${summary}</p>
            ${video}
            ${paragraphs}
            <div class="mt-4">${tags}</div>
        `);
    },

    /* ===========================
       Highlight
    ============================ */

    highlightSection(cIndex, sIndex) {
        $("#chapterList a").removeClass("active");

        $(`#chapterList a[data-c="${cIndex}"][data-s="${sIndex}"]`)
            .addClass("active");
    }
};

$(document).ready(() => {
    LEO_BOOK.init();
});
