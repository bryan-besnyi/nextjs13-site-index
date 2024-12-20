import OneLoginSignInButton from './components/SignInButton';
import { Card, CardContent, CardFooter, CardTitle } from './components/ui/card';

export default async function Home() {
  return (
    <div className="flex items-center justify-center h-[calc(100vh-72px)] bg-slate-700">
      <Card className="text-center pt-8 bg-slate-50">
        <CardTitle className="py-8">Site Index Admin</CardTitle>
        <CardContent className="max-w-md">
          Sign in with your Staff OneLogin account to manage the Site Index app.
        </CardContent>
        <CardFooter className="flex justify-center">
          <OneLoginSignInButton />
        </CardFooter>
      </Card>
    </div>
  );
}
