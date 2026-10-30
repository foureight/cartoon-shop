# Cartoon-Shop – responzivní testovací web

Statický testovací web cartoon-shop.cz složený z dvojic šablon desktop/mobil.
Každá stránka má **jednu URL**; zobrazený pohled se řídí šířkou okna:

- **≥ 1024 px** → desktopová šablona
- **< 1024 px** → mobilní šablona (fluidní šířka, telefony 320–430 px i tablety)

Při změně šířky okna se pohled přepne bez obnovení stránky (breakpoint
`matchMedia('(min-width: 1024px)')` v `public/runtime.js`).

## Stránky

| URL | Desktop | Mobil |
|---|---|---|
| `index.html` | Home | HomeMobile |
| `carhartt-wip-praha.html` | Main | Mobile |
| `katalog.html` | Catalog | CatalogMobile |
| `katalog-filtry-vlevo.html` | CatalogSide | CatalogMobile |
| `produkt.html` | Product | ProductMobile |
| `kosik.html` | Cart | CartMobile |
| `dodaci-udaje.html` | Checkout3 | Checkout3Mobile |
| `doprava-a-platba.html` | Checkout2 | Checkout2Mobile |
| `shrnuti.html` | Checkout4 | Checkout4Mobile |
| `potvrzeni.html` | Checkout5 | Checkout5Mobile |
| `prodejna.html` | Stores | StoresMobile |
| `novinky.html` | NewsArchive | NewsArchiveMobile |
| `novinka.html` | News | NewsMobile |
| `historie.html` | History | HistoryMobile |
| `distribuce.html` | Distribution | DistributionMobile |
| `kontakt.html` | Contact | ContactMobile |
| `menu.html` | HomeMenu | MenuMobile |
| `menu-obleceni.html` | HomeMenu | MenuMobile2 |
| `mailing.html` | Mailing | MailingMobile |

## Struktura

- `public/*.html` – malé „shelly“ stránek (viewport meta, React, runtime)
- `public/views/` – šablony (včetně vnořených Home2, HomeMobile2, Mobile2)
- `public/runtime.js` – renderer šablon a přepínání desktop/mobil
- `public/img/`, `public/vendor/` – obrázky, fonty a React 18 (UMD)
- `zerops.yml` – nasazení obsahu `public/` jako statické služby

Lokálně: `cd public && python3 -m http.server 8000` → http://localhost:8000/
(stránky šablony načítají přes `fetch`, takže je nelze otevřít přímo ze souboru).

## Nasazení GitHub → Zerops

1. Nahrajte repozitář na GitHub (`git remote add origin …` a `git push -u origin main`).
2. V Zerops vytvořte projekt a službu typu **Static** s hostname `web`
   (shoduje se se `setup: web` v `zerops.yml`).
3. Ve službě propojte GitHub repozitář (větev `main`) a spusťte build;
   Zerops nasadí obsah `public/` a každý další push nasadí znovu.
4. Zapněte veřejný přístup (subdoména zerops.app nebo vlastní doména).
# cartoon-shop
