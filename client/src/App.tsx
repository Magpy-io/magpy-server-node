import { CustomFlowbiteTheme, DarkThemeToggle, Flowbite, Navbar } from 'flowbite-react';

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
  textInput: {
    field: {
      input: {
        colors: {
          gray: 'dark:bg-transparent bg-transparent border-gray-300 text-gray-900 focus:border-cyan-500 focus:ring-cyan-500 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 dark:focus:border-cyan-500 dark:focus:ring-cyan-500',
        },
      },
    },
  },
  alert: {
    color: {
      failure: 'text-red-700 bg-red-100 border-red-500  dark:bg-d-bg-light dark:text-red-500',
    },
  },
};

function App() {
  SetPath(PATH);
  return (
    <Flowbite theme={{ theme: customTheme }}>
      <div className="relative min-h-screen flex flex-col justify-center  bg-l-bg dark:bg-d-bg ">
        <div className="absolute top-0 w-screen">
          <Navbar fluid rounded>
            <Navbar.Brand>
              <img src={logoDark} className="mr-3 h-9 hidden dark:block" alt="Magpy Logo" />
              <img src={logoLight} className="mr-3 h-9 dark:hidden block" alt="Magpy Logo" />
            </Navbar.Brand>
            <div className="flex md:order-2">
              <DarkThemeToggle />
            </div>
          </Navbar>
        </div>
        <div className="relative px-8 py-8 max-w-2xl self-center w-full">
          <ServerConfig />
        </div>
      </div>
    </Flowbite>
  );
}

export default App;
