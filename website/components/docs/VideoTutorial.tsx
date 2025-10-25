"use client";

import { FiPlayCircle, FiExternalLink } from "react-icons/fi";

interface VideoTutorialProps {
  videoId: string;
  title: string;
  description?: string;
  duration?: string;
}

export default function VideoTutorial({
  videoId,
  title,
  description,
  duration,
}: VideoTutorialProps) {
  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const embedUrl = `https://www.youtube.com/embed/${videoId}`;

  return (
    <div className="my-8 bg-gradient-to-br from-red-50 to-pink-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 border-2 border-red-200 dark:border-red-900">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-red-600 dark:bg-red-500 text-white p-2 rounded-lg">
          <FiPlayCircle className="text-2xl" />
        </div>
        <div className="flex-1">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h4>
          {duration && (
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Duration: {duration}
            </span>
          )}
        </div>
      </div>

      {description && (
        <p className="text-gray-700 dark:text-gray-300 mb-4">{description}</p>
      )}

      <div className="aspect-video rounded-lg overflow-hidden bg-black mb-4">
        <iframe
          src={embedUrl}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      </div>

      <a
        href={youtubeUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
      >
        <span className="font-medium">Watch on YouTube</span>
        <FiExternalLink className="text-sm" />
      </a>
    </div>
  );
}
