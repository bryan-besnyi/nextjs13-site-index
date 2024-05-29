import Link from 'next/link';
import { getServerSession } from 'next-auth/next';

const greetingEmojis = [
  '👋', // waving hand
  '😊', // smiling face with smiling eyes
  '😃', // grinning face with big eyes
  '🙂', // slightly smiling face
  '🙌', // raising hands
  '👍', // thumbs up
  '🥳', // partying face
  '🤗', // hugging face
  '🌟', // glowing star
  '✨', // sparkles
  '🎉', // party popper
  '🌈', // rainbow
  '👑', // crown
  '🎊', // confetti ball
  '😎', // smiling face with sunglasses
  '👐', // open hands
  '💫', // dizzy
  '💐', // bouquet
  '🥰', // smiling face with hearts
  '🌼' // blossom
];

const greetingPhrases = [
  'Howdy',
  'Hello',
  'Hi',
  'Hey',
  'Greetings',
  'Salutations',
  'Wassup',
  'Hey buddy',
  'Yooo',
  'Heyo'
];

// Function to get a random emoji from the array
const getRandomEmoji = () => {
  const randomIndex = Math.floor(Math.random() * greetingEmojis.length);
  return greetingEmojis[randomIndex];
};

const getRandomPhrase = () => {
  const randomIndex = Math.floor(Math.random() * greetingPhrases.length);
  return greetingPhrases[randomIndex];
};

const Header = async () => {
  const session = await getServerSession();
  const firstName = session?.user?.name?.split(' ')[0];
  return (
    <header>
      <nav>
        <ul className="px-8 py-5 text-lg text-white bg-indigo-800">
          <li className="flex items-center justify-between">
            <Link href="/" className="text-2xl">
              SMCCCD Site Index
            </Link>
            {session?.user?.email && firstName && (
              <div>
                <p className="text-xl">
                  {getRandomPhrase()}, {firstName}! {getRandomEmoji()}
                </p>
              </div>
            )}
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
