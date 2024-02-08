import {
  Button,
  CustomFlowbiteTheme,
  DarkThemeToggle,
  Flowbite,
  Navbar,
} from 'flowbite-react';

import ServerConfig from './Components/ServerConfig';
import { SetPath } from './ServerQueries';
import logoLight from './assets/LogoCompleteBlackBlue.svg';
import logoDark from './assets/LogoCompleteWhiteBlue.svg';
import { PATH } from './config';

const customTheme: CustomFlowbiteTheme = {
  navbar: {
    root: {
      base: 'bg-transparent px-2 py-2.5 dark:border-gray-700 px-4',
    },
  },
};

function App() {
  SetPath(PATH);
  return (
    <div className="relative min-h-screen flex flex-col justify-center  bg-l-bg dark:bg-d-bg ">
      <div className="absolute top-0 w-screen">
        <Flowbite theme={{ theme: customTheme }}>
          <Navbar fluid rounded>
            <Navbar.Brand>
              <img src={logoDark} className="mr-3 h-9 hidden dark:block" alt="Magpy Logo" />
              <img src={logoLight} className="mr-3 h-9 dark:hidden block" alt="Magpy Logo" />
            </Navbar.Brand>
            <div className="flex md:order-2">
              <DarkThemeToggle />
            </div>
          </Navbar>
        </Flowbite>
      </div>
      <div className="relative px-8 py-8 2xl:mx-72 xl:mx-64 lg:mx-3">
        <ServerConfig />
      </div>
    </div>
  );
}

export default App;
