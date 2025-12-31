import React, { useEffect, useState } from "react";
import { List, Tag, Empty, Input, Button } from "antd";
import {
  StarOutlined,
  StarFilled,
  SearchOutlined,
  TagOutlined,
} from "@ant-design/icons";
import { useNoteStore } from "../../store/noteStore";
import { Note } from "../../types";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/zh-cn";
import styled from "styled-components";

dayjs.extend(relativeTime);
dayjs.locale("zh-cn");

const NoteItemContainer = styled.div`
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

interface NoteListProps {
  selectedNoteId?: string;
  onSelectNote: (noteId: string) => void;
  onBack?: () => void;
}

function NoteList({ selectedNoteId, onSelectNote, onBack }: NoteListProps) {
  const { notes, setCurrentNote, toggleFavorite } = useNoteStore();
  const [searchValue, setSearchValue] = useState("");
  const [filteredNotes, setFilteredNotes] = useState<Note[]>(notes);

  // 过滤笔记
  useEffect(() => {
    if (searchValue) {
      const filtered = notes.filter(
        (note) =>
          note.title.toLowerCase().includes(searchValue.toLowerCase()) ||
          note.content.toLowerCase().includes(searchValue.toLowerCase()),
      );
      setFilteredNotes(filtered);
    } else {
      setFilteredNotes(notes);
    }
  }, [searchValue, notes]);

  // 选择笔记
  const handleSelectNote = (note: Note) => {
    setCurrentNote(note);
    onSelectNote(note.id);
  };

  // 切换收藏
  const handleToggleFavorite = async (e: React.MouseEvent, noteId: string) => {
    e.stopPropagation();
    await toggleFavorite(noteId);
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* 搜索栏 */}
      <div
        style={{
          padding: "16px",
          borderBottom: "1px solid var(--border-color)",
          background: "var(--bg-primary)",
        }}
      >
        {onBack && (
          <Button type="text" onClick={onBack} style={{ marginBottom: 8 }}>
            ← 返回
          </Button>
        )}
        <Input
          placeholder="搜索笔记..."
          prefix={<SearchOutlined />}
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          allowClear
        />
      </div>

      {/* 笔记列表 */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {filteredNotes.length === 0 ? (
          <Empty
            description={
              searchValue
                ? "没有找到匹配的笔记"
                : "还没有笔记，点击左侧按钮创建"
            }
            style={{ marginTop: 60 }}
          />
        ) : (
          <List
            dataSource={filteredNotes}
            renderItem={(note) => (
              <NoteItemContainer>
                <List.Item
                  key={note.id}
                  onClick={() => handleSelectNote(note)}
                  style={{
                    padding: "20px 16px",
                    cursor: "pointer",
                    background:
                      selectedNoteId === note.id
                        ? "rgba(24, 144, 255, 0.08)"
                        : "transparent",
                    borderBottom: "1px solid var(--border-color)",
                  }}
                >
                  <div style={{ width: "100%" }}>
                    {/* 标题行 */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        marginBottom: 8,
                      }}
                    >
                      <div style={{ flex: 1, overflow: "hidden" }}>
                        <div
                          style={{
                            fontSize: 16,
                            fontWeight: 600,
                            color: "var(--text-primary)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {note.title || "无标题"}
                        </div>
                      </div>
                      <Button
                        type="text"
                        size="small"
                        icon={
                          note.isFavorite ? <StarFilled /> : <StarOutlined />
                        }
                        onClick={(e) => handleToggleFavorite(e, note.id)}
                        style={{ flexShrink: 0 }}
                      />
                    </div>

                    {/* 内容预览 */}
                    <div
                      style={{
                        fontSize: 14,
                        color: "var(--text-secondary)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        marginBottom: 10,
                      }}
                    >
                      {note.content || "无内容"}
                    </div>

                    {/* 标签和时间 */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 13,
                        color: "var(--text-tertiary)",
                      }}
                    >
                      {note.tags.length > 0 && (
                        <>
                          <TagOutlined
                            style={{
                              fontSize: 12,
                              color: "rgba(0, 0, 0, 0.45)",
                            }}
                          />
                          {note.tags.slice(0, 2).map((tag, index) => (
                            <Tag key={index} color="blue">
                              {tag}
                            </Tag>
                          ))}
                          {note.tags.length > 2 && (
                            <Tag>+{note.tags.length - 2}</Tag>
                          )}
                        </>
                      )}
                      <span
                        style={{
                          fontSize: 12,
                          color: "rgba(0, 0, 0, 0.25)",
                          marginLeft: "auto",
                        }}
                      >
                        {dayjs(note.updatedAt).fromNow()}
                      </span>
                    </div>
                  </div>
                </List.Item>
              </NoteItemContainer>
            )}
          />
        )}
      </div>
    </div>
  );
}

export default NoteList;
