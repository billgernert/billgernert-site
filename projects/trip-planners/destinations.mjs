// Public destination catalogue. No data is imported from the private trip apps.
const place = (id, name, area, kind, detail, url, minutes = 90) => ({ id, name, area, kind, detail, url, minutes });
const hotel = (id, name, area, url) => ({ id, name, area, url });
export const destinations = {
  nashville: {
    suggestions: [{ name: 'Downtown music', places: ['country', 'ryman', 'nmaam'] }, { name: 'Art and a park', places: ['frist', 'parthenon'] }, { name: 'Markets and a show', places: ['market', 'opry'] }],
    name: 'Nashville', region: 'Tennessee, USA', theme: 'amber', heading: 'Leave room for an encore.',
    intro: 'Build a few days around music, museums, and time to wander. Start downtown, then make room for the neighborhoods beyond Broadway.',
    guide: 'https://www.visitmusiccity.com/things-to-do-in-nashville',
    tip: 'Check the performance calendar before placing a show in your itinerary. Opryland and Centennial Park are separate trips from downtown.',
    hotels: [
      hotel('omni', 'Omni Nashville Hotel', 'SoBro', 'https://www.omnihotels.com/hotels/nashville'),
      hotel('drury', 'Drury Plaza Hotel Nashville Downtown', 'SoBro', 'https://www.druryhotels.com/locations/nashville-tn/drury-plaza-hotel-nashville-downtown'),
      hotel('hermitage', 'The Hermitage Hotel', 'Downtown', 'https://thehermitagehotel.com/')
    ],
    places: [
      place('ryman', 'Ryman Auditorium', 'Downtown', 'Music', 'Choose a tour or check the concert calendar for a performance.', 'https://www.ryman.com/plan-your-visit', 120),
      place('country', 'Country Music Hall of Fame and Museum', 'SoBro', 'Culture', 'Explore the history of country music through recordings, instruments, and exhibits.', 'https://www.countrymusichalloffame.org/', 180),
      place('nmaam', 'National Museum of African American Music', 'Downtown', 'Music', 'Explore the artists and traditions that shaped American music.', 'https://www.nmaam.org/', 120),
      place('frist', 'Frist Art Museum', 'Downtown', 'Culture', 'Build a museum stop around the current exhibitions.', 'https://fristartmuseum.org/', 120),
      place('parthenon', 'The Parthenon', 'Centennial Park', 'Outdoors', 'Visit the full-scale Parthenon replica and leave time for the surrounding park.', 'https://www.nashvilleparthenon.com/', 120),
      place('opry', 'Grand Ole Opry', 'Opryland', 'Music', 'Pick a performance from the official calendar before arranging your evening.', 'https://www.opry.com/', 150),
      place('market', "Nashville Farmers’ Market", 'Bicentennial Mall', 'Food', 'Browse the market and its food vendors.', 'https://www.nashvillefarmersmarket.org/', 60),
      place('hattie', "Hattie B’s Hot Chicken", 'Multiple locations', 'Food', 'Choose a branch on the restaurant website before setting your route.', 'https://www.hattieb.com/', 60)
    ]
  },
  dominican: {
    suggestions: [{ name: 'Puntacana nature and dining', places: ['reserve', 'playablanca'] }, { name: 'Cap Cana adventure', places: ['scape'] }, { name: 'A beach day', places: ['bavaro'] }],
    name: 'Dominican Republic', region: 'Punta Cana and Cap Cana', theme: 'teal', heading: 'Make space for the coast.',
    intro: 'Plan a Punta Cana stay with beach time, nature, and meals by the water. Choose a base, then build each day at your own pace.',
    guide: 'https://www.godominicanrepublic.com/destinations/punta-cana',
    tip: 'This guide focuses on the Punta Cana area. Confirm visitor access and transport with each venue, especially for places inside a resort.',
    hotels: [
      hotel('westin', 'The Westin Puntacana Resort', 'Puntacana Resort', 'https://www.marriott.com/en-us/hotels/pujwi-the-westin-puntacana-resort/overview/'),
      hotel('ziva', 'Hyatt Ziva Cap Cana', 'Cap Cana', 'https://www.hyatt.com/ziva/en-US/pujif-hyatt-ziva-cap-cana'),
      hotel('clubmed', 'Club Med Punta Cana', 'Punta Cana', 'https://www.clubmed.us/r/punta-cana/y')
    ],
    places: [
      place('scape', 'Scape Park', 'Cap Cana', 'Adventure', 'Choose activities from the park guide, including Hoyo Azul. Check ticket inclusions.', 'https://scapepark.com/', 300),
      place('reserve', 'Ojos Indígenas Ecological Reserve', 'Puntacana Resort', 'Outdoors', 'Explore trails and freshwater lagoons. Confirm entry arrangements before visiting.', 'https://www.puntacana.com/en/', 180),
      place('playablanca', 'Playa Blanca', 'Puntacana Resort', 'Food', 'Plan a beachside meal and confirm restaurant access with the resort.', 'https://www.puntacana.com/en/dining', 90),
      place('layola', 'La Yola', 'Puntacana Marina', 'Food', 'Add a meal at the marina restaurant. Check reservations and access.', 'https://www.puntacana.com/en/dining', 90),
      place('bavaro', 'Bávaro Beach', 'Bávaro', 'Outdoors', 'Leave an open stretch of the day for the beach. Check local access and conditions.', 'https://www.godominicanrepublic.com/destinations/punta-cana', 180),
      place('macao', 'Macao Beach', 'Macao', 'Outdoors', 'Plan a separate beach outing north of the main resort areas.', 'https://www.godominicanrepublic.com/destinations/punta-cana', 180),
      place('cocobongo', 'Coco Bongo Punta Cana', 'Downtown Punta Cana', 'Music', 'Check the show calendar, entry requirements, and return transport.', 'https://www.cocobongo.com/show/punta-cana/?lang=en', 180),
      place('golf', 'La Cana Golf Club', 'Puntacana Resort', 'Adventure', 'Arrange a tee time directly with the club.', 'https://www.puntacana.com/en/', 240)
    ]
  },
  london: {
    suggestions: [{ name: 'London Bridge and Bankside', places: ['tower', 'borough', 'tate'] }, { name: 'Westminster and the West End', places: ['abbey', 'gallery'] }, { name: 'Collections and green space', places: ['british', 'hyde'] }],
    name: 'London', region: 'England, United Kingdom', theme: 'blue', heading: 'Follow the river. Find your London.',
    intro: 'Mix landmark visits with markets, galleries, and a little green space. Group nearby stops together and leave time between them.',
    guide: 'https://www.visitlondon.com/things-to-do',
    tip: 'Check timed entry and performance schedules before booking. Use Transport for London to plan journeys between neighborhoods.',
    hotels: [
      hotel('citizen', 'citizenM London Bankside', 'Bankside', 'https://www.citizenm.com/hotels/europe/london/london-bankside-hotel'),
      hotel('hoxton', 'The Hoxton, Southwark', 'Southwark', 'https://thehoxton.com/london/southwark/'),
      hotel('premier', 'Premier Inn London County Hall', 'South Bank', 'https://www.premierinn.com/gb/en/hotels/england/greater-london/london/london-county-hall.html')
    ],
    places: [
      place('tower', 'Tower of London', 'Tower Hill', 'Culture', 'Explore the fortress and Crown Jewels. Check entry tickets before visiting.', 'https://www.hrp.org.uk/tower-of-london/', 180),
      place('borough', 'Borough Market', 'London Bridge', 'Food', 'Browse food traders and plan a meal around the market.', 'https://boroughmarket.org.uk/', 90),
      place('gallery', 'The National Gallery', 'Trafalgar Square', 'Culture', 'Choose a few galleries or an exhibition for your visit.', 'https://www.nationalgallery.org.uk/', 120),
      place('abbey', 'Westminster Abbey', 'Westminster', 'Culture', 'Check sightseeing entry separately from services and special events.', 'https://www.westminster-abbey.org/', 120),
      place('hyde', 'Hyde Park', 'Hyde Park', 'Outdoors', 'Leave time for a walk around the Serpentine.', 'https://www.royalparks.org.uk/visit/parks/hyde-park', 90),
      place('globe', "Shakespeare’s Globe", 'Bankside', 'Theatre', 'Choose a theatre tour or a performance from the official programme.', 'https://www.shakespearesglobe.com/', 150),
      place('british', 'British Museum', 'Bloomsbury', 'Culture', 'Plan your route through the collections and check ticket arrangements.', 'https://www.britishmuseum.org/', 180),
      place('tate', 'Tate Modern', 'Bankside', 'Culture', 'Explore modern and contemporary art beside the Thames.', 'https://www.tate.org.uk/visit/tate-modern', 120)
    ]
  },
  paris: {
    suggestions: [{ name: 'Art and the Left Bank', places: ['orsay', 'luxembourg'] }, { name: 'Along the Seine', places: ['louvre', 'chapelle'] }, { name: 'Montmartre and a meal', places: ['sacre', 'chartier'] }],
    name: 'Paris', region: 'Île-de-France, France', theme: 'rose', heading: 'A little art. A long lunch. Paris.',
    intro: 'Make a day of a neighborhood, pair a museum with a walk, and leave room for a café stop. Your dates and the pace are up to you.',
    guide: 'https://parisjetaime.com/eng/',
    tip: 'Check opening days and timed tickets before booking museums. Allow travel time between Montmartre, the Eiffel Tower, and the city center.',
    hotels: [
      hotel('novotel', 'Novotel Paris Les Halles', 'Les Halles', 'https://all.accor.com/hotel/0785/index.en.shtml'),
      hotel('citizen', 'citizenM Paris Gare de Lyon', 'Gare de Lyon', 'https://www.citizenm.com/hotels/europe/paris/paris-gare-de-lyon-hotel'),
      hotel('grands', 'Grands Boulevards Experimental', 'Grands Boulevards', 'https://www.grandsboulevardshotel.com/hotel')
    ],
    places: [
      place('louvre', 'Musée du Louvre', 'Palais-Royal', 'Culture', 'Choose a collection or visitor trail and reserve the entry you need.', 'https://www.louvre.fr/en', 180),
      place('orsay', 'Musée d’Orsay', 'Saint-Thomas-d’Aquin', 'Culture', 'Plan time for the art collections in the former railway station.', 'https://www.musee-orsay.fr/en', 150),
      place('eiffel', 'Eiffel Tower', 'Champ de Mars', 'Culture', 'Choose your level and ticket type on the official website.', 'https://www.toureiffel.paris/en', 120),
      place('chapelle', 'Sainte-Chapelle', 'Île de la Cité', 'Culture', 'Add a visit to the stained-glass chapel and check timed entry.', 'https://www.sainte-chapelle.fr/en', 60),
      place('sacre', 'Sacré-Cœur', 'Montmartre', 'Outdoors', 'Visit the basilica and leave time to explore Montmartre on foot.', 'https://www.sacre-coeur-montmartre.com/', 90),
      place('luxembourg', 'Jardin du Luxembourg', 'Luxembourg', 'Outdoors', 'Give yourself an unhurried garden stop between visits.', 'https://jardin.senat.fr/', 90),
      place('cruise', 'Bateaux Mouches', 'Pont de l’Alma', 'Adventure', 'Check departures for a Seine cruise before choosing your time.', 'https://www.bateaux-mouches.fr/en', 90),
      place('chartier', 'Bouillon Chartier', 'Grands Boulevards', 'Food', 'Plan a meal at the Grands Boulevards restaurant and check its current menu.', 'https://www.bouillon-chartier.com/en/', 90)
    ]
  }
};
