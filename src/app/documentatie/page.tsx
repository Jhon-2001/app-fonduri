import Link from "next/link";
import { Header } from "@/components/Header";
import { BackButton } from "@/components/BackButton";
import { BulletList, ContentCard, DocSection } from "@/components/ContentCard";

export default function DocumentatiePage() {
  return (
    <div className="min-h-screen pb-16">
      <Header showHome />

      <main className="mx-auto w-full max-w-3xl px-4 pt-2">
        <BackButton />

        <h1 className="mb-6 text-center text-2xl font-bold text-[var(--fg)] sm:text-3xl">
          Documentație – ADR Nord-Vest
        </h1>

        <ContentCard>
          <div className="space-y-8">
            <DocSection title="Cum folosești aplicația">
              <p>
                Această aplicație online este utilizată exclusiv pentru{" "}
                <strong className="text-[var(--fg)]">
                  depunerea fișelor de proiect
                </strong>
                , în vederea selecției partenerilor pentru pregătirea
                documentațiilor tehnico-economice (DTE).
              </p>
              <p>Prin această aplicație:</p>
              <BulletList
                items={[
                  <>
                    <strong className="text-[var(--fg)]">
                      nu se solicită finanțare pentru investiții
                    </strong>
                    ;
                  </>,
                  <>
                    se transmite o{" "}
                    <strong className="text-[var(--fg)]">fișă de proiect</strong>
                    , care va fi evaluată conform metodologiei apelului.
                  </>,
                ]}
              />
              <p>
                Pentru a depune corect o aplicație, parcurge pașii de mai jos, în
                ordine.
              </p>
            </DocSection>

            <DocSection title="Vizualizează un exemplu completat (recomandat)">
              <p>
                Înainte de a începe completarea formularului, este recomandat să
                consulți un exemplu de formular completat corect.
              </p>
              <p>Exemplul:</p>
              <BulletList
                items={[
                  <>
                    arată cum trebuie să arate o{" "}
                    <strong className="text-[var(--fg)]">aplicație completă</strong>
                    ;
                  </>,
                  "clarifică ce informații sunt așteptate în fiecare câmp;",
                  "te ajută să eviți completările incomplete sau incorecte.",
                ]}
              />
              <p>Linkul către exemplu este disponibil pe pagina formularului.</p>
            </DocSection>

            <DocSection title="1. Accesează formularul de aplicare">
              <p>Pentru a începe:</p>
              <BulletList
                items={[
                  <>
                    accesează pagina principală și apasă butonul „
                    <strong className="text-[var(--fg)]">Deschide formular</strong>
                    ”, sau
                  </>,
                  "accesează direct pagina formularului de aplicare.",
                ]}
              />
              <p>Pe pagina formularului vei găsi:</p>
              <BulletList
                items={[
                  "formularul propriu-zis;",
                  "linkul către exemplul completat, pentru consultare.",
                ]}
              />
            </DocSection>

            <DocSection title="2. Completează datele instituției">
              <p>
                În prima secțiune a formularului se introduc datele entității care
                depune fișa de proiect.
              </p>
              <p>Câmpurile sunt:</p>
              <BulletList
                items={[
                  <>
                    <strong className="text-[var(--fg)]">
                      Numele instituției / organizației
                    </strong>
                    <br />
                    Se completează denumirea completă și oficială a entității.
                  </>,
                  <>
                    <strong className="text-[var(--fg)]">
                      Numele reprezentantului legal
                    </strong>
                    <br />
                    Persoana care are dreptul legal de a reprezenta instituția și
                    de a semna documentele.
                  </>,
                  <>
                    <strong className="text-[var(--fg)]">Adresa de e-mail</strong>
                    <br />
                    Adresa la care vei primi:
                    <ul className="mt-1 list-disc space-y-1 pl-5">
                      <li>confirmarea depunerii;</li>
                      <li>numărul unic al aplicației.</li>
                    </ul>
                  </>,
                  <>
                    <strong className="text-[var(--fg)]">
                      Număr de telefon (opțional)
                    </strong>
                    <br />
                    Număr de contact pentru eventuale clarificări.
                  </>,
                  <>
                    <strong className="text-[var(--fg)]">Județ (opțional)</strong>
                    <br />
                    Județul în care își desfășoară activitatea instituția.
                  </>,
                  <>
                    <strong className="text-[var(--fg)]">
                      Localitate (opțional)
                    </strong>
                    <br />
                    Localitatea în care își desfășoară activitatea instituția.
                  </>,
                ]}
              />
            </DocSection>

            <DocSection title="3. Completează detaliile proiectului">
              <p>
                În a doua secțiune se introduc informațiile esențiale despre fișa
                de proiect.
              </p>
              <p>Câmpurile sunt:</p>
              <BulletList
                items={[
                  <>
                    <strong className="text-[var(--fg)]">Titlul proiectului</strong>
                    <br />
                    Un titlu scurt și clar, care descrie investiția propusă.
                  </>,
                  <>
                    <strong className="text-[var(--fg)]">Valoarea solicitată</strong>
                    <br />
                    Valoarea estimată a sprijinului financiar solicitat pentru
                    pregătirea documentației tehnico-economice, exprimată în euro.
                  </>,
                  <>
                    <strong className="text-[var(--fg)]">Punctaj prescorat</strong>
                    <br />
                    Punctajul obținut în etapa de prescorare, conform metodologiei.
                  </>,
                  <>
                    <strong className="text-[var(--fg)]">Domenii de proiect</strong>
                    <br />
                    Se selectează:
                    <ul className="mt-1 list-disc space-y-1 pl-5">
                      <li>un domeniu principal;</li>
                      <li>un domeniu secundar,</li>
                    </ul>
                    dintre opțiunile disponibile în formular.
                  </>,
                ]}
              />
            </DocSection>

            <DocSection title="4. Atașează documentele necesare">
              <p>
                În această secțiune poți încărca documentele justificative
                aferente fișei de proiect.
              </p>
              <p>Pentru atașare:</p>
              <BulletList
                items={[
                  <>
                    apasă butonul „
                    <strong className="text-[var(--fg)]">Adaugă fișier</strong>” și
                    selectează documentul dorit;
                  </>,
                  <>
                    poți adăuga mai multe fișiere folosind butonul „
                    <strong className="text-[var(--fg)]">+</strong>”;
                  </>,
                  <>
                    pentru a elimina un fișier, apasă butonul „
                    <strong className="text-[var(--fg)]">X</strong>” din dreptul
                    acestuia.
                  </>,
                ]}
              />
              <p>
                Toate documentele trebuie să fie semnate electronic în format PDF,
                nici un alt tip de document nu este acceptat.
              </p>
            </DocSection>

            <DocSection title="5. Verificarea de securitate">
              <p>
                Pentru prevenirea depunerilor automate, aplicația solicită
                rezolvarea unei operații matematice simple.
              </p>
              <p>
                Introdu rezultatul corect în câmpul dedicat pentru a putea trimite
                aplicația.
              </p>
            </DocSection>

            <DocSection title="6. Trimiterea aplicației">
              <p>
                După completarea tuturor câmpurilor obligatorii și rezolvarea
                verificării de securitate:
              </p>
              <BulletList
                items={[
                  <>
                    apasă butonul „
                    <strong className="text-[var(--fg)]">Depune aplicația</strong>
                    ”.
                  </>,
                ]}
              />
              <p>
                Aplicația este transmisă către sistem și înregistrată automat.
              </p>
            </DocSection>

            <DocSection title="7. Confirmarea depunerii">
              <p>După trimiterea cu succes a aplicației:</p>
              <BulletList
                items={[
                  <>
                    vei primi un număr unic de aplicație, în formatul{" "}
                    <strong className="text-[var(--fg)]">ADRNV–ANUL–NUMĂR</strong>;
                  </>,
                  "vei primi un e-mail de confirmare la adresa introdusă;",
                  "vei fi redirecționat către pagina publică cu lista aplicațiilor depuse.",
                ]}
              />
            </DocSection>

            <DocSection title="Verificarea aplicațiilor depuse">
              <p>
                Aplicațiile depuse pot fi consultate pe pagina publică de
                aplicații, unde sunt afișate următoarele informații:
              </p>
              <BulletList
                items={[
                  "numărul aplicației;",
                  "numele instituției;",
                  "județul și localitatea;",
                  "data depunerii;",
                  <>
                    statusul aplicației:
                    <ul className="mt-1 list-disc space-y-1 pl-5">
                      <li>Înregistrat</li>
                      <li>În verificare</li>
                      <li>Aprobat</li>
                      <li>Respins</li>
                    </ul>
                  </>,
                ]}
              />
            </DocSection>

            <DocSection title="Confidențialitate">
              <p>
                Datele sensibile (adrese de e-mail, numere de telefon, documente
                atașate) nu sunt afișate public, pentru protejarea
                confidențialității aplicanților.
              </p>
            </DocSection>

            <DocSection title="Funcționalități pentru administratori">
              <p>Utilizatorii cu rol de administrator pot:</p>
              <BulletList
                items={[
                  "vizualiza toate aplicațiile depuse;",
                  "accesa detaliile complete ale fiecărei aplicații;",
                  "descărca documentele atașate;",
                  "actualiza statusul aplicațiilor;",
                  "primi notificări prin e-mail la depunerea unei aplicații noi.",
                ]}
              />
            </DocSection>
          </div>
        </ContentCard>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link href="/aplica" className="btn-primary px-5 py-3">
            Depune o aplicație acum
          </Link>
          <Link
            href="/"
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 py-3 text-sm font-semibold text-[var(--fg)] hover:bg-[var(--surface-2)]"
          >
            Pagina principală
          </Link>
          <Link
            href="/intrebari-frecvente"
            className="text-sm font-medium text-[var(--brand-blue)] underline"
          >
            Întrebări frecvente
          </Link>
        </div>
      </main>
    </div>
  );
}
