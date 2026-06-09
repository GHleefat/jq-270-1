## 1. Architecture Design
```mermaid
graph LR
    A["React 视图层"] --> B["Zustand 状态管理"]
    B --> C["游戏逻辑模块"]
    C --> D["乘客生成器"]
    C --> E["疏导员效果计算"]
    C --> F["计分与超载检测"]
    A --> G["拖拽交互 (HTML5 Drag & Drop)"]
    A --> H["动画层 (CSS Animations)"]
```

## 2. Technology Description
- 前端：React@18 + TypeScript + Tailwind CSS@3 + Vite
- 初始化工具：vite-init
- 状态管理：zustand
- 图标库：lucide-react
- 后端：无（纯前端游戏）
- 数据库：无（使用本地状态）

## 3. Route Definitions
| Route | Purpose |
|-------|---------|
| / | 游戏主页面，包含所有游戏功能 |

## 6. Data Model

### 6.1 Data Model Definition
```mermaid
erDiagram
    GAME {
        int score
        int level
        int countdown
        string phase
        int delays
    }
    CAR {
        int id
        int capacity
        int waitingPassengers
        int boardedPassengers
        boolean isOverloaded
        int guides
    }
    GUIDE {
        int id
        boolean isDeployed
        int deployedCarId
        float efficiency
    }
```

### 6.2 Type Definitions
```typescript
interface GameState {
  score: number;
  level: number;
  countdown: number;
  phase: 'waiting' | 'boarding' | 'result' | 'gameover';
  delays: number;
  cars: Car[];
  guides: Guide[];
  round: number;
}

interface Car {
  id: number;
  capacity: number;
  waitingPassengers: number;
  boardedPassengers: number;
  guides: number;
}

interface Guide {
  id: number;
  isDeployed: boolean;
  deployedCarId: number | null;
}
```
