import SysTray, { ClickEvent } from 'forked-systray';
import fs from 'fs/promises';
import path from 'path';

let systrayCreated = false;

export async function createSystray() {
  if (systrayCreated) {
    return;
  }
  systrayCreated = true;

  // if packaged app, Windows app will manage the systray
  const pkg = (process as any).pkg;
  if (pkg) {
    process.stdin.on('data', () => {
      process.exit(0);
    });
    return;
  }

  const result = await fs.readFile(path.join(__dirname, '../../assets/iconSystray.ico'), {
    encoding: 'base64',
  });

  const systray: any = new SysTray({
    menu: {
      icon: result,
      title: '',
      tooltip: 'Magpy',
      items: [
        {
          title: 'Exit',
          tooltip: 'Exit',
          checked: false,
          enabled: true,
        },
      ],
    },
  });

  systray.on('click', (event: ClickEvent) => {
    if (event.seq_id == 0) {
      systray.kill();
    }
  });
}
