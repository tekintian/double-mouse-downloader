import React, { useCallback } from 'react';
import { Button, message } from 'antd';
import { CloseCircleOutlined } from '@ant-design/icons';
import DownloadVideoItem from '../components/DownloadVideoItem';
import { useAppSelector, useAppDispatch } from '../redux/hooks';
import downloadSlice from '../redux/slices/donwload-slice';
import { cloneDeep } from 'lodash';

const DownloadPage: React.FC = () => {
  const state = useAppSelector((state) => state.download);
  const dispatch = useAppDispatch();

  // 获取所有已完成的任务
  const completedTasks = state.index.filter((taskId) => {
    const task = state.taskMap[taskId];
    if (task.type === 'video') {
      // 检查主任务下的所有子任务是否都已完成
      return task.pages.every((pageId) => {
        const pageTask = state.taskMap[pageId];
        return pageTask?.taskStatus === 'complete';
      });
    }
    return task?.taskStatus === 'complete';
  });

  // 一键清除已完成任务
  const clearCompletedTasks = useCallback(async () => {
    if (completedTasks.length === 0) {
      message.info('没有已完成的任务需要清除');
      return;
    }

    const result = await jsBridge.dialog.showMessageBox(location.href, {
      type: 'warning',
      title: '确认清除',
      message: `确定要清除 ${completedTasks.length} 个已完成的任务吗？已下载的文件将会保留。`,
      buttons: ['取消', '确定'],
    });

    if (result.response !== 1) return;

    let clearedCount = 0;
    completedTasks.forEach((taskId) => {
      const task = state.taskMap[taskId];
      if (task.type === 'video') {
        // 清除主任务及其所有子任务
        task.pages.forEach((pageId) => {
          const pageTask = state.taskMap[pageId];
          if (pageTask) {
            // 清除aria任务
            if (pageTask.type === 'videoPage') {
              dispatch(downloadSlice.actions.removeAriaItem(pageTask.taskVideo.gid));
              dispatch(downloadSlice.actions.removeAriaItem(pageTask.taskAudio.gid));
            }
            dispatch(downloadSlice.actions.removeTask(pageId));
            clearedCount++;
          }
        });
        // 清除主任务
        dispatch(downloadSlice.actions.removeTask(taskId));
        clearedCount++;
      }
    });

    message.success(`已成功清除 ${clearedCount} 个任务`);
  }, [completedTasks, state.taskMap, dispatch]);

  return (
    <main
      style={{
        margin: '0 2em',
        height: '90%',
        overflowY: 'auto',
        overflowX: 'hidden',
      }}
    >
      <section
        aria-label="下载控制"
        style={{
          marginBottom: '1em',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <span style={{ color: 'white', marginRight: '1em' }}>
            总任务数: {state.index.length}
          </span>
          <span style={{ color: 'white' }}>
            已完成: {completedTasks.length}
          </span>
        </div>
        {completedTasks.length > 0 && (
          <Button
            type="primary"
            danger
            icon={<CloseCircleOutlined />}
            onClick={clearCompletedTasks}
            size="small"
          >
            清除已完成任务 ({completedTasks.length})
          </Button>
        )}
      </section>
      {state.index.length === 0 && (
        <p style={{ color: 'white' }}>啥也木有...</p>
      )}
      <ul
        aria-label="下载列表"
        style={{
          listStyle: 'none',
          margin: '0',
          padding: '0',
        }}
      >
        {state.index.map((taskId) => {
          const task = state.taskMap[taskId];

          if (task.type === 'video')
            return <DownloadVideoItem key={taskId} task={task} />;

          return null;
        })}
      </ul>
    </main>
  );
};

export default DownloadPage;