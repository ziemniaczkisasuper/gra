# Zespół GRA – kontakty (id do SendToAgent)
Pisz bezpośrednio do działu, którego sprawa dotyczy. Producent tylko koordynuje i rozstrzyga konflikty zakresu/harmonogramu; decyzje kreatywne zatwierdza Game Director.

- ZARZ / Producent: dee08449-646c-4746-8e35-6d3ffef67c8d
- ZARZ / Game Director: 82dfabfa-1163-45cf-a670-e5841072df08
- DESIGN / Mechaniki: 37d3ff6e-61f7-4981-b8cb-b28c82558f93
- DESIGN / Balans i Ekonomia: 236dd4d9-1758-4179-8092-9e737d07de1d
- DESIGN / Level Design: 377b4c05-f469-47c8-9eb1-dcbb13cd4e7f
- PROG / Silnik i Narzędzia: b9562afe-5cb5-4b05-afc7-83e52d6d0ef5
- PROG / Gameplay: edd92ee7-d325-425e-a851-f17af9354aaa
- PROG / UI i Menu: 81b6a3ee-8267-40a2-8175-7da97430ca9d
- GRAF / Concept i Styl: a112bbe4-3f84-4fe8-8236-b6b95fcfa67c
- GRAF / Assety i Animacja: d03dae10-1b3b-4619-bd7f-b9be63c45695
- AUDIO / Muzyka i Dźwięk: e4861e2e-ff08-4365-97a2-524438f25996 (poza M1)
- FABUŁA / Scenarzysta: 60fb2553-efa0-4977-b04d-af8baa07302b
- FABUŁA / Dialogi i Lore: 0b565b64-b36c-48e0-ac5f-aae0bbc73351
- QA / Tester 1: a1325173-dede-4a79-a54a-befd6ccea8e4
- QA / Tester 2: 423f8a19-6fcf-4fe2-9061-94dd6e4c7a5e
- LUZ / Pracownik 1 (zagadka Power Lines): 89119a78-d52e-4603-82f1-f29d02dee53c
- LUZ / Pracownik 2 (kontrakty w kodzie): 56226851-6f2d-4e22-9649-0e929fd143bf
- LUZ / Pracownik 3 (sterowanie dotykowe): c34e3f18-efac-4389-943e-14461f180b76
- LUZ / Pracownik 4 (grafika ASCII w kodzie): 29030e7c-580b-4e46-97dd-f18fe230371b

## Decyzje Producenta (25.10.2026)
- Krótka sesja (decyzja GD, zastępuje wcześniejszą): mierzymy całość od otwarcia gry do podsumowania, mediana ≤ 3 min, p80 ≤ 4 min; kontrakt mieści się w tym.
- Jedno źródło glifów: src/data/style.ts. Kod walki (COMBAT_STYLE) ma się do niego odwoływać, a nie duplikować liter.
- Nauka gry (onboarding) w M1: projektują Mechaniki z UI i Menu, teksty Dialogi i Lore; ma się zmieścić w Prologu, bez osobnego samouczka.

## Decyzje Game Directora (25.10.2026, ok. 21:04)
- styl-ascii.md v1.2 ZATWIERDZONY; dron = Buddy Drone, glif `¤`.
- Rzadkości: Salvaged / Tuned / Grid-Grade – ostateczne.
- Zapowiedź ciosu: obowiązuje reguła „zapowiedź minus tick ≥ 400 ms”.
- Zabezpieczenia przed stratą: potwierdzenie przy `>` z AT RISK (z opcją wyłączenia w ustawieniach), znacznik „can be lost”, jednorazowe wyjaśnienie zasady przy pierwszej śmierci z łupem. Trudność bez zmian.
- Ekran śmierci i podsumowanie pokazują przyczynę śmierci (kto zabił, ostatnie trafienia); podsumowania zawsze prawdziwe.
- QA: progi [QA] to wskaźniki, nie kryteria wyjścia. Wyjście z M1 = testy techniczne przechodzą (zapis 100%, brak obrażeń od niewidocznego wroga) + właściciel po zagraniu potwierdza, że chce grać dalej. Testy: symulacja, boty QA, granie właściciela.
- assety-m1.md v1.0 ZATWIERDZONE. Z9 wyjątek OK; S6 `*` w trzech rolach (wracamy, jeśli QA C8 wykaże pomyłki); S11 `<` w strefie, `>` w bazie; Z5: w M1 wrogowie nie odradzają się w trakcie poziomu; Z6/Z12/Z13 rozstrzygają Mechaniki.

## Decyzje Producenta (cd.)
- iOS Safari: Silnik – persist(), licznik gry, lastExportAt, zdarzenie save:exportReminder, PWA w M1; UI – okno przypomnienia o eksporcie i zachęta „Add to Home Screen”; QA – test na prawdziwym iPhonie po publikacji (właściciel).
- Repo: prywatne https://github.com/ziemniaczkisasuper/gra (konto właściciela ziemniaczkisasuper). Hosting docelowo Cloudflare Pages. Nic nie pushujemy bez sygnału Producenta.
- 25.10: repo ziemniaczkisasuper/gra jest PUBLICZNE; hosting GitHub Pages (base "/gra/"). Push nadal tylko na sygnał Producenta.
