import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';

interface CourseData {
  name: string;
  description: string;
  country: string;
  continent: "Europe";
}

const courseData: CourseData[] = [
  {
    name: "Morfontaine (Grand Parcours)",
    description: "A masterpiece of timeless design where Simpson's legendary architecture meets Phillips' modern touches. Each round through this historic layout feels like stepping through golfing history, with strategic challenges that reward both power and precision.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Utrecht de Pan (Utrechtse Golfclub)",
    description: "This intellectual golf challenge prioritizes strategy over raw power. The back nine particularly demands careful course management and thoughtful shot selection, making it a true test of golfing intelligence.",
    country: "Continental Europe", 
    continent: "Europe"
  },
  {
    name: "Lofoten Links",
    description: "A dramatic golfing experience carved into Norway's spectacular northern coastline. This remote gem offers breathtaking views and memorable holes that make every journey worthwhile for the dedicated golfer.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Royal Hague (Koninklijke Haagsche)",
    description: "An elevated coastal course where North Sea winds test your game across beautifully undulating terrain. This represents Dutch golf at its most traditional and challenging, demanding respect from every player.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Real Club Valderrama",
    description: "Golf's ultimate examination where championship caliber is required on every shot. This course demands complete concentration and technical precision from the first tee to the final green.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Terras da Comporta (Dunas)",
    description: "A serene escape through expansive dunes and towering pines. The peaceful atmosphere belies a genuine test that challenges players while providing a tranquil retreat from everyday pressures.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Les Bordes Golf Club (New)",
    description: "An adventurous modern design featuring cleverly crafted par threes that combine visual drama with strategic complexity. Each hole offers both aesthetic beauty and tactical challenges.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Golf de Chantilly (Vineuil)",
    description: "Parkland perfection where elegant routing flows through magnificent mature trees. This layout masterfully balances challenge with tranquility in the heart of French golf country.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Fontainebleau Golf Club",
    description: "A fairytale setting deep within ancient forests where the layout flows naturally through the landscape. Clever hole designs work in perfect harmony with the surrounding natural beauty.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Real Club de Golf Sotogrande",
    description: "A course steeped in golfing tradition where Trent Jones' original vision continues to shine. The thoughtful variety and classic design elements create an enduring test of golf.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Hamburger Golf Club Falkenstein",
    description: "A peaceful woodland sanctuary with intelligent routing that utilizes every compass direction. The lush forest setting provides both beauty and strategic interest throughout the round.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "El Saler",
    description: "Javier Arana's masterpiece delivers a dramatic coastal journey with spectacular sea views. Its reputation as one of Continental Europe's finest courses is well-earned through brilliant shot values and memorable holes.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Monte Rei Golf and Country Club (North)",
    description: "An Algarve showpiece perfectly positioned between mountain ranges and Atlantic coastline. This scenic layout combines dramatic terrain with strategic challenges in supremely relaxing surroundings.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Camiral (Stadium)",
    description: "A modern masterpiece born from European Tour vision with TPC-style drama built in. This championship venue tests elite players while providing spectacle and excitement for all who play it.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Saint Germain Golf Club (Grand Parcours)",
    description: "A peaceful parkland classic that has hosted the French Open with distinction. Towering trees frame the fairways creating a sense of golfing tradition and classical charm throughout.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Kennemer Golf & Country Club",
    description: "Rolling linksland topped by an iconic thatched clubhouse creates magical first impressions. This authentic Dutch links experience delivers memorable golf in truly special surroundings.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Les Bordes Golf Club (Old)",
    description: "Subtle American design influences blend with unmistakably French character. The polished conditioning and challenging layout create a sophisticated golfing experience that satisfies the most demanding players.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Visby Golf Club (The One)",
    description: "Over fifty years of Scandinavian golf tradition continues to attract admirers. This coastal gem on Kronholmen offers enduring appeal through strategic challenges and natural beauty.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Budersand Sylt GolfKlubb",
    description: "The opening hole sets an immediate dramatic tone with its thrilling downhill curve to an elevated green. This challenging start promises an exciting round through unique German coastal terrain.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "West Cliffs",
    description: "Cynthia Dye's inspired design north of Lisbon showcases rugged coastal scenery. This striking modern layout balances contemporary challenges with Portugal's natural dramatic landscape.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Bro Hof Slott Golf Club (Stadium)",
    description: "A championship powerhouse that has already hosted five Scandinavian Masters. The bold design and proven tournament pedigree mark this as Sweden's premier golfing venue.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Real Club de Golf Las Brisas",
    description: "A pioneering venue that introduced bent grass to European golf, proven during the 1973 World Cup. This timeless layout continues to blend classic architecture with modern conditioning standards.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Royal Antwerp Golf Club (Tom Simpson)",
    description: "Belgium's oldest golf club represents continental Europe's finest architectural heritage. The Willie Park Jr. and Tom Simpson collaboration creates a masterpiece steeped in golfing tradition.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Eindhovensche Golf",
    description: "Colt's masterful routing through dense woodland south of the city feels completely natural. This classic design demonstrates timeless course architecture at its most seamless and elegant.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Finca Cortesin Golf Club",
    description: "Routed through a dramatic inland valley across one of Europe's longest layouts. This challenging venue combines impressive length with spectacular visual drama throughout the round.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Falsterbo Golf Club (Golfklubb)",
    description: "A rare European links course at Sweden's southern tip offers authentic windswept golf. This scenic layout captures true links character with natural challenges and coastal atmosphere.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Terre Blanche (Château)",
    description: "Dave Thomas' design flows beautifully across the Provencal countryside feeling perfectly integrated with the land. This course captures the essence of French golf in spectacular surroundings.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Palmares Golf (Praia & Lagos)",
    description: "The Algarve's coastal spirit comes alive through this vibrant, varied layout. Distinct zones throughout the course create the feeling of playing three different courses in one memorable round.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Noordwijkse Golf Club",
    description: "A rugged seaside course moving through natural dunes and pine forests. Formby-style surprises await throughout this authentic Dutch coastal golfing experience.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Great Northern",
    description: "Nicklaus Design's bold modern creation features seven artificial lakes and tournament-ready conditioning. This polished layout represents contemporary golf architecture at its most ambitious.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Les Aisses Golf (Les Aisses)",
    description: "Hawtree's transformation created a timeless heathland classic with strong Golden Age character. The fair but thoughtful layout provides both challenge and aesthetic pleasure.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Oitavos Dunes",
    description: "A brilliant blend combining forested holes with seaside exposure creates a uniquely Portuguese experience. This masterful design showcases the best of both inland and coastal golf.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Hilversumsche",
    description: "One of the Netherlands' most refined layouts offers prestigious golf with midweek accessibility. This course represents Dutch golf tradition at its most elegant and sophisticated.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "The Scandinavian (Old)",
    description: "Bruce Charlton's design flows through pine-strewn landscape with strategic variety at every turn. This fairway routing provides consistent challenge across varied Scandinavian terrain.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Quinta do Lago (South)",
    description: "William Mitchell's American-style design shines even brighter after major 2020 renovations. Bold greens, tees, and bunkers create a distinctive Algarve golfing experience.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Rosendaelsche",
    description: "Classic Dutch heathland golf dating to 1895 flows effortlessly over gentle forested terrain. This traditional layout represents the finest elements of Netherlands golf heritage.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Cabot Bordeaux (Châteaux) Golf du Médoc",
    description: "Bill Coore's third solo design enhanced by Rod Whitman creates refined elegance in northern Bordeaux. This sophisticated layout showcases thoughtful architecture in wine country.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Carya Golf Club",
    description: "Peter Thomson's architectural firm created this outstanding Turkish design combining strategy with aesthetic beauty. The layout delivers a superb playing experience in Mediterranean surroundings.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Bernardus Golf",
    description: "Despite opening only in 2018, this modern layout has already earned European Tour hosting honors. The ambitious design and polished execution mark it as a rising star.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Real Club La Moraleja (3)",
    description: "This spacious layout in northern Madrid reflects the club's commitment to expanding elite golf in Spain. The generous design provides both challenge and playability.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Royal Limburg",
    description: "Delightful woodland routing winds through dense trees with all the charm of British heathland. The twisting layout provides constant variety and natural beauty throughout.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Lübker Golf Resort (Sand & Sky)",
    description: "Danish golfers' high regard for this Robert Trent Jones complex is well justified. The variety and quality delivered across the Danish landscape sets this venue apart.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Thracian Cliffs",
    description: "Gary Player's signature design sits dramatically along Bulgaria's Black Sea coastline. The unforgettable views and challenging layout create a truly memorable golfing experience.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Dom Pedro Old Course Golf Club",
    description: "Vilamoura's historic Algarve gem has stood the test of time through grand pines and smart strategic challenges. This classic layout continues to reward thoughtful play.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Royal Zoute (Championship)",
    description: "Nick Faldo rightfully called this Belgian coastal gem a 'hidden treasure.' Pure links character combines with subtle challenges to create exceptional seaside golf.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Köln",
    description: "One of Germany's oldest clubs features a mature 1952 forest course in Refrath. This classic layout provides quiet sophistication and enduring golfing pleasure.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Kristianstads GolfKlubb (East)",
    description: "Åhus Östra represents one of Sweden's finest courses set on sandy, rolling terrain. The heritage and playability combine to create an outstanding Scandinavian golf experience.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Real Puerta de Hierro (Abajo)",
    description: "This famously private Madrid club's younger Abajo course shows tremendous promise. While less historic than its sibling Arriba, it delivers quality golf in exclusive surroundings.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Royal Park I Roveri (Allianz by Trent Jones Sr.)",
    description: "Robert Trent Jones' 1971 Italian masterpiece remains a proud showcase of his design talent. This classic layout demonstrates timeless championship golf architecture.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Silkeborg (Syd & Vest)",
    description: "Located in 'the heart of Jutland,' this treasured Danish layout features outstanding natural flow. The pristine setting and thoughtful design create memorable golf experiences.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Le Golf National (Albatros)",
    description: "Just west of Paris, this Ryder Cup venue masterfully blends stadium design with French golf flair. The championship pedigree shines through every strategic challenge.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Pärnu Bay Golf Links",
    description: "Estonia's rising star designed by Lassi Pekka Tilander and shaped by Mick McShane rivals Northern Europe's finest. This emerging gem showcases Baltic golf potential.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Ullna Golf & CC",
    description: "Swedish lakeside holes dominate this unique layout where winter transforms the namesake lake into a massive skating rink. The setting provides unmatched seasonal variety.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Golf Club Biella",
    description: "Le Betulle in northern Italy offers serene, traditional golf beautifully routed by Englishman John Morrison. This peaceful course captures Italian golf at its most elegant.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Royal Belgium (Old)",
    description: "Ravenstein's rich heritage shines through Tom Simpson's redesign making it architecturally significant throughout Belgium. This historic club represents continental golf tradition.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Golf de Chiberta",
    description: "Tom Simpson's rare and revered southwest France design offers authentic Atlantic coast links golf. This precious layout provides genuine seaside challenges in French surroundings.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Praia D'El Rey Golf & Beach Resort",
    description: "Sensory golf through dunes, pines, and bold terrain creates a thrilling ride. This Portuguese course showcases the country's natural beauty through exciting design challenges.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Montgomerie Maxx Royal",
    description: "Colin Montgomerie's Turkish design delivers modern championship golf with luxury amenities. This sophisticated layout provides world-class golf in Mediterranean surroundings.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Le Touquet Golf Resort (La Mer)",
    description: "C.H. Alison's coastal dunes links design creates a true shotmaker's course. This seaside gem provides authentic links challenges in classic French seaside settings.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Scandinavian (New)",
    description: "As challenging as its acclaimed sibling, this course opens with a tight, technical hole that sets the demanding tone. The layout rewards precision throughout.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Villa d'Este",
    description: "This 1926 forest routing has aged gracefully, maintaining Italian charm and championship heritage. The classic design continues to provide sophisticated golfing pleasure.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Real Club Sevilla Golf",
    description: "Andalusian flair meets competitive golf at this proud 2004 World Golf Championships host venue. The layout brings Spanish character to championship-level challenges.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Vallda",
    description: "Near Gothenburg, this course channels classic British design through fescue fairways and heathland styling. An invigorating Swedish surprise with traditional character.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Golf d'Hardelot (Les Pins)",
    description: "Dunes and pines create true French coastal beauty with timeless Edwardian spirit. This classic layout captures the essence of traditional seaside golf architecture.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Linna",
    description: "Routed through serene pine and birch forest near the historic Vanajan Linna Hotel. This peaceful course provides picturesque golf in tranquil Finnish surroundings.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Hubbelrath (East)",
    description: "Just outside Düsseldorf, this challenging course spreads across 90 hectares of forested, hilly terrain. Perfect for golfers who appreciate technical, demanding rounds.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Österåker (Öster by Stenson)",
    description: "Elite design inspired by TPC Sawgrass creates thrilling stadium-style golf from the opening hole. This exciting layout provides championship-level drama throughout.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "San Lorenzo Golf Course",
    description: "Sandy, undulating terrain alongside the Atlantic with umbrella pines and Ria Formosa wetlands creates stunning natural settings. This course showcases Portugal's coastal beauty.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Real Sociedad Hipica Espanola (North)",
    description: "One of Spain's finest courses combining smart design with Robert von Hagge's signature aesthetic vision. The layout delivers both beauty and strategic challenges.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "PGA National Czech Republic",
    description: "Kyle Phillips' visual and technical centerpiece within the Oaks Prague estate represents ambitious modern design. This impressive layout showcases Czech golf potential.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Frankfurter Golf Club",
    description: "Colt and Morrison's design oozes history and elegance as a former German Open venue. This classic layout continues to challenge players with traditional charm.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Föhr (Rot & Gelb)",
    description: "Intelligent routing maximizes limited land to deliver a walkable 27-hole experience with wonderful variety. This German island course makes the most of every acre.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Halmstad Golfklubb (Norra)",
    description: "One of Sweden's finest tree-lined courses offering strategic, consistent challenges. This local and visitor favorite delivers quality golf through traditional Scandinavian terrain.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Ålands (Castle)",
    description: "The Åland Islands' standout course features peninsula views and quality layout design. This regional highlight clearly represents the best golf in this unique location.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Real Sociedad de Golf de Neguri",
    description: "Old-world prestige meets coastal views in this beautifully aged 1961 layout. The course has matured gracefully while maintaining its classic Spanish character.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "The National Golf Club (Irmak & Tuna) - Antalya",
    description: "Gentle terrain and elegant routing make this one of Turkey's finest modern courses. The sophisticated design showcases Mediterranean golf at its most refined.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Le Kempferhof",
    description: "Robert von Hagge's bold Alsatian design demands strategic thinking in sublime settings. This tough but beautiful course challenges players while showcasing regional character.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "The National (Links)",
    description: "Over a decade in development near Malmö, the wait proved worthwhile for this elite layout. Now regarded among Sweden's finest golf courses with championship credentials.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Royal Bled (King's)",
    description: "Swan Golf Designs' 2017 renovation restored the King's course to its best, creating a Central European golf beacon. This premier layout represents regional golf excellence.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Seignosse",
    description: "Inland from the Bay of Biscay, this French gem combines stunning beauty with brutal challenges. The photogenic course tests players as severely as it impresses them.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Real El Prat (Pink)",
    description: "Real Club de Golf El Prat's Pink course is long, broad, and fair—a modern Spanish classic. This layout rewards precision and patience through generous but strategic design.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Domaine Imperial Golf Club",
    description: "Pete Dye's rare European creation delivers bold visuals and memorable holes beside Lake Geneva. This distinctive design showcases the master's signature style in Alpine settings.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Antalya Golf Club (PGA Sultan)",
    description: "Carved through pine and eucalyptus forests, this course pairs natural beauty with surprisingly tough challenges. The Turkish layout delivers both aesthetic pleasure and strategic demands.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Barsebäck Resort (Ocean)",
    description: "Championship pedigree built on two top-tier Swedish coastal courses explains this venue's shining reputation. The seaside setting provides both beauty and challenge.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "La Reserva Club",
    description: "This Spanish powerhouse isn't for the faint-hearted, demanding both power and nerve across wide fairways. The long, challenging layout tests every aspect of your game.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Royal Ostend",
    description: "Belgium's only authentic links course offers genuine coastal golf challenges full of natural nuance. This seaside layout provides rare links experience on the continent.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Olgiata Golf Club (West)",
    description: "Twenty-seven holes wind through Roman parkland framed by stately trees and gentle undulations. This lush, peaceful layout provides an elegant escape in historic surroundings.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Club de Campo Villa de Madrid (Negro)",
    description: "A vast golfing metropolis capable of hosting Europe's biggest events with vibrant energy. This comprehensive facility represents Spanish golf on the grandest scale.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Adamstal Golf Club (Championship)",
    description: "Austria's crown jewel features cool alpine air and dramatic elevation changes creating breathtaking, bold golf. This mountain course delivers both scenic beauty and serious challenges.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Lage Vuursche",
    description: "Kyle Phillips' restoration triumph revived rolling woodland terrain into a flowing, characterful course. This successful renovation showcases thoughtful modern course restoration.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Berlin-Wannsee Golf & Country Club (Championship)",
    description: "A grand old club with prestigious history flowing through every part of its manicured layout. This traditional venue represents German golf heritage at its finest.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Winston (Links)",
    description: "Germany's closest approach to seaside golf features sandy soil and bold shaping creating an inland links experience. This standout design captures links character away from the coast.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Penati (Heritage)",
    description: "Golden Age inspiration meets Sandbelt flair in Slovakia's finest layout. The strategic design and classic architecture make this course a regional masterpiece.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Real Pedrena",
    description: "Seve Ballesteros' home course retains his legacy through classic Colt routing and stunning coastal outlook. This historic venue continues to inspire through traditional design excellence.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Verdura Resort (East Links)",
    description: "Pure Kyle Phillips design featuring wide corridors and clever shaping creates the perfect foil to its West sibling. This Sicilian coastal course showcases modern links architecture.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Club de Golf Alcanada",
    description: "Robert Trent Jones Jr.'s design offers iconic bay and lighthouse views without ever feeling forced. This natural layout captures Mallorca's coastal beauty through thoughtful architecture.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Costa Navarino (Dunes)",
    description: "Greece's golf pioneer launched in 2010 with coastal views, rolling terrain, and elegant shaping. This inaugural course established Greek golf through world-class design and conditioning.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "San Roque Golf Club (Old)",
    description: "Million-dollar-per-hole construction costs deliver prestige and quality in every aspect. This impressive Spanish layout was built to impress and succeeds completely.",
    country: "Continental Europe",
    continent: "Europe"
  },
  {
    name: "Holstebro (Skovbanen)",
    description: "Honest, peaceful golf in Denmark's fresh air provides understated joy throughout every round. This course may be modest but delivers genuine golfing pleasure consistently.",
    country: "Continental Europe",
    continent: "Europe"
  }
];

const BulkCourseImport: React.FC = () => {
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importedCount, setImportedCount] = useState(0);
  

  const handleImport = async () => {
    setIsImporting(true);
    setProgress(0);
    setImportedCount(0);

    try {
      const totalCourses = courseData.length;
      
      for (let i = 0; i < courseData.length; i++) {
        const course = courseData[i];
        
        // Check if course already exists
        const { data: existingCourse } = await supabase
          .from('golf_courses')
          .select('id')
          .eq('name', course.name)
          .maybeSingle();

        if (!existingCourse) {
          const { error } = await supabase
            .from('golf_courses')
            .insert({
              name: course.name,
              description: course.description,
              country: course.country,
              continent: course.continent,
              thumbnail_image: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop',
            });

          if (error) {
            console.error(`Error inserting ${course.name}:`, error);
          } else {
            setImportedCount(prev => prev + 1);
          }
        }

        setProgress(((i + 1) / totalCourses) * 100);
      }

      toast.success("Import Complete", { description: `Successfully imported ${importedCount} new courses` });
    } catch (error) {
      console.error('Import error:', error);
      toast.error("Import Error", { description: "Failed to import courses" });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-4 p-6 border rounded-lg">
      <h3 className="text-lg font-semibold">Bulk Course Import</h3>
      <p className="text-muted-foreground">
        Import {courseData.length} Continental European golf courses
      </p>
      
      {isImporting && (
        <div className="space-y-2">
          <Progress value={progress} className="w-full" />
          <p className="text-sm text-muted-foreground">
            Imported {importedCount} courses... {Math.round(progress)}% complete
          </p>
        </div>
      )}
      
      <Button 
        onClick={handleImport} 
        disabled={isImporting}
        className="w-full bg-[#b66b41] hover:bg-[#a55a3a] text-white"
      >
        {isImporting ? 'Importing...' : 'Import All Courses'}
      </Button>
    </div>
  );
};

export default BulkCourseImport;
