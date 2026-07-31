import { useMemo, useState } from 'react';
import {
  Heart,
  MessageCircle,
  Send,
  ImagePlus,
  X,
  Globe,
  Lock,
  Trash2,
  PenLine,
} from 'lucide-react';
import type { AppData } from '@/hooks/useAppData';
import type { Post } from '@/types/database';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/Toast';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Textarea } from '@/components/ui/Input';
import { ClickableAvatar, ClickableName } from '@/components/shared/ClickableUser';
import { cn, formatDate } from '@/lib/utils';

interface FeedPageProps {
  data: AppData;
  onViewProfile?: (empId: string) => void;
}

export function FeedPage({ data, onViewProfile }: FeedPageProps) {
  const { posts, employees, refresh } = data;
  const toast = useToast();
  const { user: currentUser } = useCurrentUser();

  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [visibility, setVisibility] = useState<'public' | 'internal'>('public');
  const [posting, setPosting] = useState(false);
  const [openComments, setOpenComments] = useState<Set<string>>(new Set());
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [liking, setLiking] = useState<string | null>(null);

  const currentUserId = currentUser?.id ?? '';

  async function handlePost() {
    if (!content.trim() || !currentUserId) return;
    setPosting(true);
    const { error } = await supabase.from('posts').insert({
      author_id: currentUserId,
      content: content.trim(),
      image_url: imageUrl.trim() || null,
      visibility,
    });
    setPosting(false);
    if (error) {
      toast.error('Could not publish post', error.message);
      return;
    }
    toast.success('Post published');
    setContent('');
    setImageUrl('');
    setShowImageInput(false);
    refresh();
  }

  async function toggleLike(post: Post) {
    const existing = post.likes?.find((l) => l.employee_id === currentUserId);
    setLiking(post.id);
    if (existing) {
      const { error } = await supabase.from('post_likes').delete().eq('id', existing.id);
      if (error) toast.error('Could not unlike', error.message);
    } else {
      const { error } = await supabase.from('post_likes').insert({
        post_id: post.id,
        employee_id: currentUserId,
      });
      if (error) toast.error('Could not like', error.message);
    }
    setLiking(null);
    refresh();
  }

  async function addComment(postId: string) {
    const text = commentText[postId]?.trim();
    if (!text || !currentUserId) return;
    const { error } = await supabase.from('post_comments').insert({
      post_id: postId,
      author_id: currentUserId,
      content: text,
    });
    if (error) {
      toast.error('Could not add comment', error.message);
      return;
    }
    setCommentText({ ...commentText, [postId]: '' });
    refresh();
  }

  async function deletePost(post: Post) {
    if (post.author_id !== currentUserId) return;
    const { error } = await supabase.from('posts').delete().eq('id', post.id);
    if (error) {
      toast.error('Could not delete post', error.message);
      return;
    }
    toast.success('Post removed');
    refresh();
  }

  function toggleComments(postId: string) {
    const next = new Set(openComments);
    if (next.has(postId)) next.delete(postId);
    else next.add(postId);
    setOpenComments(next);
  }

  return (
    <div className="space-y-5 lg:space-y-6">
      <PageHeader title="Feed" description="Share updates, wins and announcements with your team" />

      <div className="mx-auto max-w-2xl space-y-4">
        {/* Composer */}
        <Card className="p-4 dark:bg-ink-850/60 dark:border-white/[0.06]">
          <div className="flex gap-3">
            <Avatar name={currentUser?.name ?? 'You'} src={currentUser?.avatar_url} size="md" />
            <div className="flex-1">
              <Textarea
                rows={3}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share something with your team…"
                className="border-0 bg-transparent p-0 focus:ring-0"
              />

              {showImageInput && (
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="Image URL (https://…)"
                    className="input-base h-9 flex-1 text-[13px]"
                  />
                  <button
                    onClick={() => setShowImageInput(false)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-400 hover:bg-ink-100 dark:hover:bg-white/5"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {imageUrl && (
                <div className="mt-2 overflow-hidden rounded-xl">
                  <img src={imageUrl} alt="Preview" className="max-h-48 w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
              )}

              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setShowImageInput((v) => !v)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-400 transition-colors hover:bg-ink-100 hover:text-brand-600 dark:hover:bg-white/5 dark:hover:text-brand-400"
                    aria-label="Add image"
                  >
                    <ImagePlus className="h-4.5 w-4.5" />
                  </button>
                  <button
                    onClick={() => setVisibility((v) => v === 'public' ? 'internal' : 'public')}
                    className="flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-medium text-ink-500 transition-colors hover:bg-ink-100 dark:text-ink-400 dark:hover:bg-white/5"
                  >
                    {visibility === 'public' ? <Globe className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                    {visibility === 'public' ? 'Public' : 'Internal'}
                  </button>
                </div>
                <Button
                  size="sm"
                  onClick={handlePost}
                  loading={posting}
                  disabled={!content.trim()}
                >
                  <Send className="h-3.5 w-3.5" /> Post
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Feed */}
        {posts.length === 0 ? (
          <Card className="dark:bg-ink-850/60 dark:border-white/[0.06]">
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500/10">
                <PenLine className="h-6 w-6 text-brand-500 dark:text-brand-400" />
              </div>
              <p className="font-display text-sm font-semibold text-ink-900 dark:text-white">No posts yet</p>
              <p className="mt-1 text-[13px] text-ink-500 dark:text-ink-400">Be the first to share something with your team.</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4 stagger">
            {posts.map((post) => {
              const liked = post.likes?.some((l) => l.employee_id === currentUserId);
              const likeCount = post.likes?.length ?? 0;
              const commentCount = post.comments?.length ?? 0;
              const isAuthor = post.author_id === currentUserId;
              return (
                <Card key={post.id} className="overflow-hidden dark:bg-ink-850/60 dark:border-white/[0.06]">
                  {/* Header */}
                  <div className="flex items-start gap-3 p-4">
                    <ClickableAvatar employee={post.author} name={post.author?.name ?? 'Unknown'} src={post.author?.avatar_url} size="md" onViewProfile={onViewProfile} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <ClickableName employee={post.author} name={post.author?.name ?? 'Unknown'} onViewProfile={onViewProfile} className="truncate text-[14px]" />
                        {post.author?.role === 'admin' && (
                          <Badge tone="brand" soft>Admin</Badge>
                        )}
                      </div>
                      <p className="truncate text-xs text-ink-500 dark:text-ink-400">
                        {post.author?.position} · {formatDate(post.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {post.visibility === 'internal' && (
                        <Lock className="h-3.5 w-3.5 text-ink-400" />
                      )}
                      {isAuthor && (
                        <button
                          onClick={() => deletePost(post)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 transition-colors hover:bg-danger-50 hover:text-danger-600 dark:hover:bg-danger-500/10"
                          aria-label="Delete post"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="px-4 pb-3">
                    <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-ink-700 dark:text-ink-200">
                      {post.content}
                    </p>
                  </div>

                  {post.image_url && (
                    <div className="px-4 pb-3">
                      <img
                        src={post.image_url}
                        alt="Post attachment"
                        className="w-full rounded-xl object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-1 border-t border-ink-100 px-2 py-1.5 dark:border-white/[0.06]">
                    <button
                      onClick={() => toggleLike(post)}
                      disabled={liking === post.id}
                      className={cn(
                        'flex h-9 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium transition-colors',
                        liked
                          ? 'text-danger-600 dark:text-danger-400'
                          : 'text-ink-500 hover:bg-ink-50 dark:text-ink-400 dark:hover:bg-white/[0.03]',
                      )}
                    >
                      <Heart className={cn('h-4 w-4', liked && 'fill-current')} />
                      {likeCount > 0 && <span className="tabular">{likeCount}</span>}
                    </button>
                    <button
                      onClick={() => toggleComments(post.id)}
                      className="flex h-9 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium text-ink-500 transition-colors hover:bg-ink-50 dark:text-ink-400 dark:hover:bg-white/[0.03]"
                    >
                      <MessageCircle className="h-4 w-4" />
                      {commentCount > 0 && <span className="tabular">{commentCount}</span>}
                    </button>
                  </div>

                  {/* Comments */}
                  {openComments.has(post.id) && (
                    <div className="border-t border-ink-100 bg-ink-50/50 px-4 py-3 dark:border-white/[0.06] dark:bg-white/[0.02]">
                      {post.comments && post.comments.length > 0 && (
                        <div className="space-y-3">
                          {post.comments.map((c) => (
                            <div key={c.id} className="flex gap-2.5">
                              <ClickableAvatar employee={c.author} name={c.author?.name ?? 'Unknown'} src={c.author?.avatar_url} size="sm" onViewProfile={onViewProfile} />
                              <div className="min-w-0 flex-1">
                                <div className="rounded-xl bg-white px-3 py-2 ring-1 ring-ink-100 dark:bg-white/[0.04] dark:ring-white/[0.06]">
                                  <ClickableName employee={c.author} name={c.author?.name ?? 'Unknown'} onViewProfile={onViewProfile} className="text-[13px]" />
                                  <p className="text-[13px] text-ink-700 dark:text-ink-300">{c.content}</p>
                                </div>
                                <p className="mt-0.5 pl-3 text-[11px] text-ink-400 dark:text-ink-500">{formatDate(c.created_at)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="mt-3 flex gap-2">
                        <Avatar name={currentUser?.name ?? 'You'} src={currentUser?.avatar_url} size="sm" />
                        <input
                          type="text"
                          value={commentText[post.id] ?? ''}
                          onChange={(e) => setCommentText({ ...commentText, [post.id]: e.target.value })}
                          onKeyDown={(e) => { if (e.key === 'Enter') addComment(post.id); }}
                          placeholder="Write a comment…"
                          className="input-base h-9 flex-1 text-[13px]"
                        />
                        <Button size="sm" variant="secondary" onClick={() => addComment(post.id)}>
                          <Send className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
