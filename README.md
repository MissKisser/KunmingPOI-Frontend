# KunmingPOI

> **作者：** Hackerdallas

昆明市 POI 空间同位模式挖掘系统

## 项目结构

- `kunming_poi_frontend/` - 前端大屏可视化（Vue 3 + TypeScript + 高德地图）
- `scripts/` - 核心算法工作区（Python）
  - `poi_data_converter.py` - 数据预处理
  - `BasicToos2025070.py` - 底层核心算法库
  - `FPI_joinless(new_FPI_Joinless).py` - 顶层挖掘主程序
