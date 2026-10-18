import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconProp } from "@fortawesome/fontawesome-svg-core";
import {
  faGauge,
  faGraduationCap,
  faDumbbell,
  faLanguage,
  faGamepad,
  faChartLine,
  faBookOpen,
  faGear,
  faCircleExclamation,
  faTriangleExclamation,
  faArrowLeft,
  faArrowRight,
  faRightLeft,
  faWaveSquare,
  faBrain,
  faCheck,
  faCircleCheck,
  faCopy,
  faCrown,
  faEarListen,
  faFileAudio,
  faFileArrowDown,
  faFileCode,
  faFileLines,
  faFire,
  faGaugeHigh,
  faHand,
  faKeyboard,
  faSpinner,
  faPlay,
  faStop,
  faTrophy,
  faUpload,
  faXmark,
  faHeadphones,
  faRotate,
  faLayerGroup,
  faBolt,
  faInfinity,
  faCalendarCheck,
  faRobot,
  faPaperPlane,
  faKey,
  faDownload,
  faCloudArrowUp,
  faFolderOpen,
  faTriangleExclamation as faWarningDup,
  faClock,
  faShieldHalved,
  faEye,
  faEyeSlash,
  faTrash,
  faPlus,
  faSearch,
  faBell,
  faCircleQuestion,
  faChevronRight,
  faStar,
  faMedal,
  faBullseye,
  faListCheck,
} from "@fortawesome/free-solid-svg-icons";

/**
 * Every icon used across Relay is registered here under a
 * semantic name, so components request `<Icon name="play" />` instead
 * of importing raw FontAwesome icon objects. This keeps icon usage
 * consistent and makes swapping the underlying icon library (should it
 * ever be needed again) a one-file change.
 */
const ICONS = {
  dashboard: faGauge,
  learn: faGraduationCap,
  practice: faDumbbell,
  translator: faLanguage,
  games: faGamepad,
  progress: faChartLine,
  encyclopedia: faBookOpen,
  settings: faGear,

  alertCircle: faCircleExclamation,
  alertTriangle: faTriangleExclamation,
  arrowLeft: faArrowLeft,
  arrowRight: faArrowRight,
  swap: faRightLeft,
  waveform: faWaveSquare,
  brain: faBrain,
  check: faCheck,
  checkCircle: faCircleCheck,
  copy: faCopy,
  crown: faCrown,
  ear: faEarListen,
  fileAudio: faFileAudio,
  fileDownload: faFileArrowDown,
  fileJson: faFileCode,
  fileText: faFileLines,
  flame: faFire,
  gauge: faGaugeHigh,
  hand: faHand,
  keyboard: faKeyboard,
  spinner: faSpinner,
  play: faPlay,
  stop: faStop,
  trophy: faTrophy,
  upload: faUpload,
  close: faXmark,

  headphones: faHeadphones,
  refresh: faRotate,
  flashcards: faLayerGroup,
  speed: faBolt,
  endless: faInfinity,
  daily: faCalendarCheck,

  ai: faRobot,
  send: faPaperPlane,
  apiKey: faKey,
  download: faDownload,
  cloudUpload: faCloudArrowUp,
  folder: faFolderOpen,
  warning: faWarningDup,
  clock: faClock,
  shield: faShieldHalved,
  eye: faEye,
  eyeOff: faEyeSlash,
  trash: faTrash,
  add: faPlus,
  search: faSearch,
  bell: faBell,
  help: faCircleQuestion,
  chevronRight: faChevronRight,
  star: faStar,
  medal: faMedal,
  target: faBullseye,
  checklist: faListCheck,
} as const;

export type IconName = keyof typeof ICONS;

interface IconProps {
  name: IconName;
  className?: string;
  size?: "xs" | "sm" | "lg" | "xl" | "2xl" | "1x" | "2x" | "3x";
  spin?: boolean;
  "aria-hidden"?: boolean;
  title?: string;
}

export function Icon({ name, className, size, spin, title, ...rest }: IconProps) {
  return (
    <FontAwesomeIcon
      icon={ICONS[name] as IconProp}
      className={className}
      size={size}
      spin={spin}
      title={title}
      aria-hidden={rest["aria-hidden"] ?? !title}
    />
  );
}
